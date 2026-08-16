package com.hrms.payroll.dto;

import java.time.Instant;

public record PayrollResponse(
        Long id,
        Long employeeId,
        String employeeName,
        String payrollMonth,
        Double basicSalary,
        Double allowances,
        Double deductions,
        Double bonuses,
        Double grossSalary,
        Double netSalary,
        String strategyName,
        Instant createdAt,
        Instant updatedAt) {
}
