package com.hrms.performance.dto;

import jakarta.validation.constraints.NotBlank;

public class GoalStatusUpdateRequest {
    
    @NotBlank(message = "Status cannot be null or empty")
    private String status;

    public GoalStatusUpdateRequest() {}

    public GoalStatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}