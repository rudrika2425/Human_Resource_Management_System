package com.hrms.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PayrollGenerateRequest(@NotNull Long employeeId, @NotBlank String payrollMonth) {
}
