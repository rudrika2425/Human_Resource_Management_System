package com.hrms.leave.service;

import com.hrms.common.exception.ConflictException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.leave.dto.LeaveActionDto;
import com.hrms.leave.dto.LeaveBalanceResponse;
import com.hrms.leave.dto.LeaveRequestDto;
import com.hrms.leave.dto.LeaveResponse;
import com.hrms.leave.entity.LeaveBalance;
import com.hrms.leave.entity.LeaveRequest;
import com.hrms.leave.entity.LeaveStatus;
import com.hrms.leave.entity.LeaveType;
import com.hrms.leave.repository.LeaveBalanceRepository;
import com.hrms.leave.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class LeaveService {

    private static final int DEFAULT_LEAVE_BALANCE = 12;

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;

    
    public LeaveService(
            LeaveRequestRepository leaveRequestRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            EmployeeRepository employeeRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.employeeRepository = employeeRepository;
    }

    public LeaveResponse apply(LeaveRequestDto request) {
        Employee employee = findActiveEmployee(request.employeeId());
        validateDateRange(request.startDate(), request.endDate());
        ensureNoOverlap(employee.getId(), request.startDate(), request.endDate());
        
        LeaveBalance balance = getOrCreateBalance(employee, request.leaveType());
        long requestedDays = daysBetween(request.startDate(), request.endDate());
        
        if (balance.getAvailableDays() - balance.getUsedDays() < requestedDays && 
            request.leaveType() != LeaveType.UNPAID) {
            throw new ConflictException("Insufficient leave balance");
        }
        
        LeaveRequest leave = new LeaveRequest();
        leave.setEmployee(employee);
        leave.setLeaveType(request.leaveType());
        leave.setStartDate(request.startDate());
        leave.setEndDate(request.endDate());
        leave.setReason(request.reason());
        leave.setStatus(LeaveStatus.PENDING);
        
        return toResponse(leaveRequestRepository.save(leave));
    }

    public LeaveResponse approve(Long leaveId, LeaveActionDto action) {
        LeaveRequest leave = findLeave(leaveId);
        
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new ConflictException("Only pending leave can be approved");
        }
        
        LeaveBalance balance = getOrCreateBalance(leave.getEmployee(), leave.getLeaveType());
        long requestedDays = daysBetween(leave.getStartDate(), leave.getEndDate());
        
        if (leave.getLeaveType() != LeaveType.UNPAID && 
            balance.getAvailableDays() - balance.getUsedDays() < requestedDays) {
            throw new ConflictException("Insufficient leave balance");
        }
        
        if (leave.getLeaveType() != LeaveType.UNPAID) {
            balance.setUsedDays(balance.getUsedDays() + (int) requestedDays);
            leaveBalanceRepository.save(balance);
        }
        
        leave.setStatus(LeaveStatus.APPROVED);
        leave.setApproverId(action.approverId());
        leave.setApprovalRemarks(action.remarks());
        leave.setApprovedAt(LocalDateTime.now());
        
        return toResponse(leaveRequestRepository.save(leave));
    }

    public LeaveResponse reject(Long leaveId, LeaveActionDto action) {
        LeaveRequest leave = findLeave(leaveId);
        
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new ConflictException("Only pending leave can be rejected");
        }
        
        leave.setStatus(LeaveStatus.REJECTED);
        leave.setApproverId(action.approverId());
        leave.setApprovalRemarks(action.remarks());
        
        return toResponse(leaveRequestRepository.save(leave));
    }

    public LeaveResponse cancel(Long leaveId) {
        LeaveRequest leave = findLeave(leaveId);
        
        if (leave.getStatus() == LeaveStatus.CANCELLED || leave.getStatus() == LeaveStatus.REJECTED) {
            throw new ConflictException("Leave cannot be cancelled");
        }
        
        if (leave.getStatus() == LeaveStatus.APPROVED && leave.getLeaveType() != LeaveType.UNPAID) {
            LeaveBalance balance = getOrCreateBalance(leave.getEmployee(), leave.getLeaveType());
            balance.setUsedDays(Math.max(0, balance.getUsedDays() - 
                    (int) daysBetween(leave.getStartDate(), leave.getEndDate())));
            leaveBalanceRepository.save(balance);
        }
        
        leave.setStatus(LeaveStatus.CANCELLED);
        leave.setCancelledAt(LocalDateTime.now());
        
        return toResponse(leaveRequestRepository.save(leave));
    }

    @Transactional(readOnly = true)
    public List<LeaveResponse> history(Long employeeId) {
        return leaveRequestRepository.findByEmployee_IdOrderByStartDateDesc(employeeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LeaveBalanceResponse balance(Long employeeId, LeaveType leaveType) {
        LeaveBalance balance = getOrCreateBalance(findActiveEmployee(employeeId), leaveType);
        return new LeaveBalanceResponse(
                employeeId, 
                leaveType, 
                balance.getAvailableDays(), 
                balance.getUsedDays()
        );
    }

    @Transactional(readOnly = true)
    public List<LeaveResponse> pendingLeaves() {
        return leaveRequestRepository
                .findByStatusOrderByStartDateAsc(LeaveStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private LeaveRequest findLeave(Long leaveId) {
        return leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new NotFoundException("Leave request not found"));
    }

    private Employee findActiveEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        
        if (!employee.isActive() || employee.isDeleted() || 
            employee.getEmploymentStatus() == EmploymentStatus.TERMINATED) {
            throw new ConflictException("Employee is inactive");
        }
        return employee;
    }

    private LeaveBalance getOrCreateBalance(Employee employee, LeaveType leaveType) {
        return leaveBalanceRepository.findByEmployee_IdAndLeaveType(employee.getId(), leaveType)
                .orElseGet(() -> {
                    LeaveBalance newBalance = new LeaveBalance();
                    newBalance.setEmployee(employee);
                    newBalance.setLeaveType(leaveType);
                    newBalance.setAvailableDays(DEFAULT_LEAVE_BALANCE);
                    newBalance.setUsedDays(0);
                    return leaveBalanceRepository.save(newBalance);
                });
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new ConflictException("Start date cannot be after end date");
        }
    }

    private void ensureNoOverlap(Long employeeId, LocalDate startDate, LocalDate endDate) {
        boolean overlap = leaveRequestRepository
                .findByEmployee_IdAndStatusIn(employeeId, List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED))
                .stream()
                .anyMatch(existing -> !existing.getEndDate().isBefore(startDate) && 
                                      !existing.getStartDate().isAfter(endDate));
        
        if (overlap) {
            throw new ConflictException("Leave overlaps with an existing request");
        }
    }

    private long daysBetween(LocalDate startDate, LocalDate endDate) {
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    private LeaveResponse toResponse(LeaveRequest leave) {
        return new LeaveResponse(
                leave.getId(),
                leave.getEmployee().getId(),
                leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName(),
                leave.getLeaveType(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getReason(),
                leave.getStatus(),
                leave.getApproverId(),
                leave.getApprovalRemarks(),
                leave.getApprovedAt(),
                leave.getCancelledAt()
        );
    }
}