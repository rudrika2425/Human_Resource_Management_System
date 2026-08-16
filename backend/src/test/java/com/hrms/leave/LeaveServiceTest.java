package com.hrms.leave;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.hrms.common.exception.ConflictException;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.leave.dto.LeaveRequestDto;
import com.hrms.leave.entity.LeaveBalance;
import com.hrms.leave.entity.LeaveRequest;
import com.hrms.leave.entity.LeaveStatus;
import com.hrms.leave.entity.LeaveType;
import com.hrms.leave.repository.LeaveBalanceRepository;
import com.hrms.leave.repository.LeaveRequestRepository;
import com.hrms.leave.service.LeaveService;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LeaveServiceTest {

    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private LeaveBalanceRepository leaveBalanceRepository;
    @Mock private EmployeeRepository employeeRepository;

    private LeaveService leaveService;

    @BeforeEach
    void setUp() {
        leaveService = new LeaveService(leaveRequestRepository, leaveBalanceRepository, employeeRepository);
    }

    @Test
    void applyRejectsOverlappingLeave() {
        Employee employee = Employee.builder().active(true).deleted(false).employmentStatus(EmploymentStatus.ACTIVE).employmentType(EmploymentType.FULL_TIME).build();
        employee.setId(1L);
        LeaveBalance balance = LeaveBalance.builder().employee(employee).leaveType(LeaveType.ANNUAL).availableDays(12).usedDays(0).build();
        LeaveRequest existing = LeaveRequest.builder().employee(employee).status(LeaveStatus.APPROVED).startDate(LocalDate.of(2026, 8, 10)).endDate(LocalDate.of(2026, 8, 12)).build();
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveBalanceRepository.findByEmployee_IdAndLeaveType(1L, LeaveType.ANNUAL)).thenReturn(Optional.of(balance));
        when(leaveRequestRepository.findByEmployee_IdAndStatusIn(1L, List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED))).thenReturn(List.of(existing));

        LeaveRequestDto request = new LeaveRequestDto(1L, LeaveType.ANNUAL, LocalDate.of(2026, 8, 11), LocalDate.of(2026, 8, 13), "Vacation");

        assertThatThrownBy(() -> leaveService.apply(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Leave overlaps");
    }
}
