package com.hrms.leave.repository;

import com.hrms.leave.entity.LeaveRequest;
import com.hrms.leave.entity.LeaveStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hrms.employee.entity.Employee;
import com.hrms.leave.entity.LeaveType;
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployee_IdOrderByStartDateDesc(Long employeeId);
    List<LeaveRequest> findByEmployee_IdAndStatusIn(Long employeeId, List<LeaveStatus> statuses);
    boolean existsByEmployeeAndLeaveTypeAndStartDate(
        Employee employee,
        LeaveType leaveType,
        LocalDate startDate
);
List<LeaveRequest> findByStatusOrderByStartDateAsc(LeaveStatus status);
List<LeaveRequest> findByEmployee_Manager_IdOrderByStartDateDesc(Long managerId); 
List<LeaveRequest> findByEmployee_Manager_IdAndStatusOrderByStartDateAsc(Long managerId, LeaveStatus status);

}
