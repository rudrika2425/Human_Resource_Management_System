package com.hrms.leave.dto;

import com.hrms.leave.entity.LeaveType;

public record LeaveBalanceResponse(Long employeeId, LeaveType leaveType, Integer availableDays, Integer usedDays) {
}
