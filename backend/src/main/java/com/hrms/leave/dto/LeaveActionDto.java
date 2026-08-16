package com.hrms.leave.dto;

import jakarta.validation.constraints.NotBlank;

public record LeaveActionDto(@NotBlank String remarks, Long approverId) {
}
