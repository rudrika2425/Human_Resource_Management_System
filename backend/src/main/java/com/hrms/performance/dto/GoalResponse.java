package com.hrms.performance.dto;

import com.hrms.performance.entity.GoalStatus;
import com.hrms.performance.entity.PriorityLevel;
import java.time.Instant;
import java.time.LocalDate;

public record GoalResponse(Long id, String title, String description, String target, LocalDate dueDate, PriorityLevel priority, GoalStatus status, Long employeeId, String employeeName, Long managerId, String managerName, Instant createdAt, Instant updatedAt) {
}
