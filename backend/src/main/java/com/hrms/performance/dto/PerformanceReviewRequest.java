package com.hrms.performance.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class PerformanceReviewRequest {

    @NotNull
    private final Long employeeId;

    @NotNull
    private final Long managerId;

    @NotNull
    private final Integer technicalSkills;

    @NotNull
    private final Integer communication;

    @NotNull
    private final Integer teamwork;

    @NotNull
    private final Integer leadership;

    @NotNull
    private final Integer problemSolving;

    @NotNull
    private final Integer overallRating;

    private final String feedback;

    @NotNull
    private final LocalDate reviewDate;

    // Standard Java Class Constructor used by Jackson
    @JsonCreator
    public PerformanceReviewRequest(
            @JsonProperty("employeeId") Long employeeId,
            @JsonProperty("managerId") Long managerId,
            @JsonProperty("technicalSkills") Integer technicalSkills,
            @JsonProperty("communication") Integer communication,
            @JsonProperty("teamwork") Integer teamwork,
            @JsonProperty("leadership") Integer leadership,
            @JsonProperty("problemSolving") Integer problemSolving,
            @JsonProperty("overallRating") Integer overallRating,
            @JsonProperty("feedback") String feedback,
            @JsonProperty("reviewDate") LocalDate reviewDate
    ) {
        this.employeeId = employeeId;
        this.managerId = managerId;
        this.technicalSkills = technicalSkills;
        this.communication = communication;
        this.teamwork = teamwork;
        this.leadership = leadership;
        this.problemSolving = problemSolving;
        this.overallRating = overallRating;
        this.feedback = feedback;
        this.reviewDate = reviewDate;
    }

    // Getters (This fixes the calls in your PerformanceService)
    public Long getEmployeeId() { return employeeId; }
    public Long getManagerId() { return managerId; }
    public Integer getTechnicalSkills() { return technicalSkills; }
    public Integer getCommunication() { return communication; }
    public Integer getTeamwork() { return teamwork; }
    public Integer getLeadership() { return leadership; }
    public Integer getProblemSolving() { return problemSolving; }
    public Integer getOverallRating() { return overallRating; }
    public String getFeedback() { return feedback; }
    public LocalDate getReviewDate() { return reviewDate; }
}