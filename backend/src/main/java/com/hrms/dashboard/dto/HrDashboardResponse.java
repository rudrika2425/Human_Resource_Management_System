package com.hrms.dashboard.dto;

public record HrDashboardResponse(long totalEmployees, long activeEmployees, long presentToday, long employeesOnLeave, long pendingLeave, long openJobs, long unreadNotifications) {
}
