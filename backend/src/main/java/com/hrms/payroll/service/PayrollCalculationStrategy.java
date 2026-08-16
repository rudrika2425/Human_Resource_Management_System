package com.hrms.payroll.service;

public interface PayrollCalculationStrategy {
    PayrollCalculationResult calculate(double basicSalary, double allowances, double deductions, double bonuses);
    String name();
}
