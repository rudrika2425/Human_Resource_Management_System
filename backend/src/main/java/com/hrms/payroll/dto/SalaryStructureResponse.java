package com.hrms.payroll.dto;

import java.time.Instant;

public record SalaryStructureResponse(
        Long id,
        Long employeeId,
        Double basicSalary,
        Double allowances,
        Double deductions,
        Double bonuses,
        Instant createdAt,
        Instant updatedAt) {
}
