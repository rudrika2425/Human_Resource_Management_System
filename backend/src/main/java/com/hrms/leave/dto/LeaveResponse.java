package com.hrms.leave.dto;

import com.hrms.leave.entity.LeaveStatus;
import com.hrms.leave.entity.LeaveType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LeaveResponse(
        Long id,
        Long employeeId,
        String employeeName,
        LeaveType leaveType,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        LeaveStatus status,
        Long approverId,
        String approvalRemarks,
        LocalDateTime approvedAt,
        LocalDateTime cancelledAt) {
}
