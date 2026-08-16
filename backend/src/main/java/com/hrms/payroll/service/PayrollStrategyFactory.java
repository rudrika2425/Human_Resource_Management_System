package com.hrms.payroll.service;

import com.hrms.employee.entity.EmploymentType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PayrollStrategyFactory {

    private final List<PayrollCalculationStrategy> strategies;

    
    public PayrollStrategyFactory(List<PayrollCalculationStrategy> strategies) {
        this.strategies = strategies;
    }

    public PayrollCalculationStrategy getStrategy(EmploymentType employmentType) {
        if (employmentType == EmploymentType.CONTRACT) {
            return strategies.stream()
                    .filter(strategy -> "CONTRACT".equals(strategy.name()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("No CONTRACT payroll strategy found"));
        }
        return strategies.stream()
                .filter(strategy -> "STANDARD".equals(strategy.name()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No STANDARD payroll strategy found"));
    }
}