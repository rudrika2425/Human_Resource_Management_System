package com.hrms.leave.repository;

import com.hrms.leave.entity.LeaveBalance;
import com.hrms.leave.entity.LeaveType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hrms.employee.entity.Employee;
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    Optional<LeaveBalance> findByEmployee_IdAndLeaveType(Long employeeId, LeaveType leaveType);
    boolean existsByEmployeeAndLeaveType(
        Employee employee,
        LeaveType leaveType
);
}
