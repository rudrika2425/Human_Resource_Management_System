package com.hrms.payroll.dto;

import jakarta.validation.constraints.NotNull;

public record SalaryStructureRequest(
        @NotNull Long employeeId,
        @NotNull Double basicSalary,
        @NotNull Double allowances,
        @NotNull Double deductions,
        @NotNull Double bonuses) {
}
