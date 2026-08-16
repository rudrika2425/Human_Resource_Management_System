package com.hrms.performance.dto;

import java.time.Instant;
import java.time.LocalDate;

public record PerformanceReviewResponse(Long id, Long employeeId, String employeeName, Long managerId, String managerName, Integer technicalSkills, Integer communication, Integer teamwork, Integer leadership, Integer problemSolving, Integer overallRating, String feedback, LocalDate reviewDate, Instant createdAt, Instant updatedAt) {
}
