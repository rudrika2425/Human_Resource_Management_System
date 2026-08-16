package com.hrms.performance.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hrms.performance.entity.GoalStatus;
import com.hrms.performance.entity.PriorityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class GoalRequest {

    @NotBlank private final String title;
    private final String description;
    @NotBlank private final String target;
    @NotNull private final LocalDate dueDate;
    @NotNull private final PriorityLevel priority;
    @NotNull private final GoalStatus status;
    @NotNull private final Long employeeId;
    @NotNull private final Long managerId;

    @JsonCreator
    public GoalRequest(
            @JsonProperty("title") String title,
            @JsonProperty("description") String description,
            @JsonProperty("target") String target,
            @JsonProperty("dueDate") LocalDate dueDate,
            @JsonProperty("priority") PriorityLevel priority,
            @JsonProperty("status") String status, // Jackson passes this as a String
            @JsonProperty("employeeId") Long employeeId,
            @JsonProperty("managerId") Long managerId
    ) {
        this.title = title;
        this.description = description;
        this.target = target;
        this.dueDate = dueDate;
        this.priority = priority;
        this.employeeId = employeeId;
        this.managerId = managerId;
        
        // ✅ FIX: Calculate the value ONCE and assign it to the final field
        GoalStatus parsedStatus;
        if ("OPEN".equalsIgnoreCase(status)) {
            parsedStatus = GoalStatus.NOT_STARTED;
        } else {
            try {
                parsedStatus = GoalStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                parsedStatus = GoalStatus.NOT_STARTED; // Fallback default
            }
        }
        this.status = parsedStatus;
    }

    // Getters
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getTarget() { return target; }
    public LocalDate getDueDate() { return dueDate; }
    public PriorityLevel getPriority() { return priority; }
    public GoalStatus getStatus() { return status; }
    public Long getEmployeeId() { return employeeId; }
    public Long getManagerId() { return managerId; }
}