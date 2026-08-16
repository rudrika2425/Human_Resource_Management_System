package com.hrms.dashboard.dto;

public record EmployeeDashboardResponse(long attendanceRecords, long leaveBalance, long payrollRecords, long notifications, long upcomingInterviews) {
}
