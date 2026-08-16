package com.hrms.payroll.service;

import org.springframework.stereotype.Component;

@Component
public class ContractPayrollStrategy implements PayrollCalculationStrategy {
    @Override
    public PayrollCalculationResult calculate(double basicSalary, double allowances, double deductions, double bonuses) {
        double gross = basicSalary + bonuses;
        double net = gross - deductions;
        return new PayrollCalculationResult(gross, net);
    }

    @Override
    public String name() {
        return "CONTRACT";
    }
}
