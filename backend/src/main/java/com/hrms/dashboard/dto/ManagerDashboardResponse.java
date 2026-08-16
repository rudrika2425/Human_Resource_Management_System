package com.hrms.dashboard.dto;

public record ManagerDashboardResponse(long teamSize, long teamPresentToday, long pendingApprovals, long goals, long performanceReviews) {
}
