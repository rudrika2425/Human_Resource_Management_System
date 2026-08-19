package com.hrms.dashboard.service;
import java.util.List;
import com.hrms.attendance.entity.AttendanceStatus;
import com.hrms.attendance.repository.AttendanceRepository;
import com.hrms.audit.repository.AuditLogRepository;
import com.hrms.dashboard.dto.EmployeeDashboardResponse;
import com.hrms.dashboard.dto.HrDashboardResponse;
import com.hrms.dashboard.dto.ManagerDashboardResponse;
import com.hrms.department.repository.DepartmentRepository;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.leave.entity.LeaveStatus;
import com.hrms.leave.repository.LeaveBalanceRepository;
import com.hrms.leave.repository.LeaveRequestRepository;
import com.hrms.payroll.repository.PayrollRepository;
import com.hrms.performance.repository.GoalRepository;
import com.hrms.performance.repository.PerformanceReviewRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final PayrollRepository payrollRepository;
    private final GoalRepository goalRepository;
    private final PerformanceReviewRepository performanceReviewRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogRepository auditLogRepository;

    
    public DashboardService(
            EmployeeRepository employeeRepository,
            AttendanceRepository attendanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            PayrollRepository payrollRepository,
            GoalRepository goalRepository,
            PerformanceReviewRepository performanceReviewRepository,
            DepartmentRepository departmentRepository,
            AuditLogRepository auditLogRepository) {
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.payrollRepository = payrollRepository;
        this.goalRepository = goalRepository;
        this.performanceReviewRepository = performanceReviewRepository;
        this.departmentRepository = departmentRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public HrDashboardResponse hrDashboard() {
        LocalDate today = LocalDate.now();
        long totalEmployees = employeeRepository.count();
        long activeEmployees = employeeRepository.findAll().stream()
                .filter(Employee::isActive)
                .count();
        long presentToday = attendanceRepository.countByWorkDateAndStatus(today, AttendanceStatus.PRESENT)
                + attendanceRepository.countByWorkDateAndStatus(today, AttendanceStatus.LATE);
        long employeesOnLeave = leaveRequestRepository.findAll().stream()
                .filter(leave -> leave.getStatus() == LeaveStatus.APPROVED)
                .filter(leave -> !leave.getStartDate().isAfter(today) && !leave.getEndDate().isBefore(today))
                .count();
        long pendingLeave = leaveRequestRepository.findAll().stream()
                .filter(leave -> leave.getStatus() == LeaveStatus.PENDING)
                .count();
        
        
        return new HrDashboardResponse(
            totalEmployees, 
            activeEmployees, 
            presentToday, 
            employeesOnLeave, 
            pendingLeave,
            0L,  
            0L   
        );
    }

    public ManagerDashboardResponse managerDashboard(Long managerEmployeeId) {

    List<Employee> team = employeeRepository
            .findByManager_IdAndDeletedFalse(managerEmployeeId);

    long teamSize = team.size();

    LocalDate today = LocalDate.now();

    long teamPresentToday = team.stream()
            .map(Employee::getId)
            .map(id -> attendanceRepository.findByEmployee_IdAndWorkDate(id, today))
            .filter(java.util.Optional::isPresent)
            .map(java.util.Optional::get)
            .filter(attendance -> attendance.getStatus() == AttendanceStatus.PRESENT
                    || attendance.getStatus() == AttendanceStatus.LATE)
            .count();

    long pendingApprovals = leaveRequestRepository.findAll().stream()
            .filter(leave -> leave.getStatus() == LeaveStatus.PENDING)
            .count();

    long goals = goalRepository.findAll().stream()
            .filter(goal -> goal.getManager() != null &&
                    goal.getManager().getId().equals(managerEmployeeId))
            .count();

    long performanceReviews = performanceReviewRepository.findAll().stream()
            .filter(review -> review.getManager() != null &&
                    review.getManager().getId().equals(managerEmployeeId))
            .count();

    return new ManagerDashboardResponse(
        teamSize,
        teamPresentToday,
        pendingApprovals,
        goals,
        performanceReviews
    );
}

    public EmployeeDashboardResponse employeeDashboard(Long employeeId) {
        long attendanceRecords = attendanceRepository
                .findByEmployee_IdOrderByWorkDateDesc(employeeId, PageRequest.of(0, 1000))
                .getTotalElements();
        
        long leaveBalance = leaveBalanceRepository.findAll().stream()
                .filter(balance -> balance.getEmployee().getId().equals(employeeId))
                .mapToLong(balance -> balance.getAvailableDays() - balance.getUsedDays())
                .sum();
        
        long payrollRecords = payrollRepository
                .findByEmployee_IdOrderByPayrollMonthDesc(employeeId)
                .size();
        
        
        return new EmployeeDashboardResponse(
            attendanceRecords, 
            leaveBalance, 
            payrollRecords,
            0L,  
            0L   
        );
    }
}