package com.hrms.payroll.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.employee.entity.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "payrolls")
public class Payroll extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, length = 7)
    private String payrollMonth;

    @Column(nullable = false)
    private Double basicSalary;

    @Column(nullable = false)
    private Double allowances;

    @Column(nullable = false)
    private Double deductions;

    @Column(nullable = false)
    private Double bonuses;

    @Column(nullable = false)
    private Double grossSalary;

    @Column(nullable = false)
    private Double netSalary;

    @Column(nullable = false)
    private String strategyName;

    // Default constructor
    public Payroll() {
    }

    // Constructor with all fields
    public Payroll(Employee employee, String payrollMonth, Double basicSalary,
                   Double allowances, Double deductions, Double bonuses,
                   Double grossSalary, Double netSalary, String strategyName) {
        this.employee = employee;
        this.payrollMonth = payrollMonth;
        this.basicSalary = basicSalary;
        this.allowances = allowances;
        this.deductions = deductions;
        this.bonuses = bonuses;
        this.grossSalary = grossSalary;
        this.netSalary = netSalary;
        this.strategyName = strategyName;
    }

    // Getters
    public Employee getEmployee() {
        return employee;
    }

    public String getPayrollMonth() {
        return payrollMonth;
    }

    public Double getBasicSalary() {
        return basicSalary;
    }

    public Double getAllowances() {
        return allowances;
    }

    public Double getDeductions() {
        return deductions;
    }

    public Double getBonuses() {
        return bonuses;
    }

    public Double getGrossSalary() {
        return grossSalary;
    }

    public Double getNetSalary() {
        return netSalary;
    }

    public String getStrategyName() {
        return strategyName;
    }

    // Setters
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public void setPayrollMonth(String payrollMonth) {
        this.payrollMonth = payrollMonth;
    }

    public void setBasicSalary(Double basicSalary) {
        this.basicSalary = basicSalary;
    }

    public void setAllowances(Double allowances) {
        this.allowances = allowances;
    }

    public void setDeductions(Double deductions) {
        this.deductions = deductions;
    }

    public void setBonuses(Double bonuses) {
        this.bonuses = bonuses;
    }

    public void setGrossSalary(Double grossSalary) {
        this.grossSalary = grossSalary;
    }

    public void setNetSalary(Double netSalary) {
        this.netSalary = netSalary;
    }

    public void setStrategyName(String strategyName) {
        this.strategyName = strategyName;
    }

    // Builder pattern
    public static PayrollBuilder builder() {
        return new PayrollBuilder();
    }

    public static class PayrollBuilder {
        private Employee employee;
        private String payrollMonth;
        private Double basicSalary;
        private Double allowances;
        private Double deductions;
        private Double bonuses;
        private Double grossSalary;
        private Double netSalary;
        private String strategyName;

        public PayrollBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public PayrollBuilder payrollMonth(String payrollMonth) {
            this.payrollMonth = payrollMonth;
            return this;
        }

        public PayrollBuilder basicSalary(Double basicSalary) {
            this.basicSalary = basicSalary;
            return this;
        }

        public PayrollBuilder allowances(Double allowances) {
            this.allowances = allowances;
            return this;
        }

        public PayrollBuilder deductions(Double deductions) {
            this.deductions = deductions;
            return this;
        }

        public PayrollBuilder bonuses(Double bonuses) {
            this.bonuses = bonuses;
            return this;
        }

        public PayrollBuilder grossSalary(Double grossSalary) {
            this.grossSalary = grossSalary;
            return this;
        }

        public PayrollBuilder netSalary(Double netSalary) {
            this.netSalary = netSalary;
            return this;
        }

        public PayrollBuilder strategyName(String strategyName) {
            this.strategyName = strategyName;
            return this;
        }

        public Payroll build() {
            return new Payroll(employee, payrollMonth, basicSalary, allowances,
                    deductions, bonuses, grossSalary, netSalary, strategyName);
        }
    }

    // Business methods
    public Double calculateGrossSalary() {
        return basicSalary + allowances + bonuses;
    }

    public Double calculateNetSalary() {
        return grossSalary - deductions;
    }

    public void recalculate() {
        this.grossSalary = calculateGrossSalary();
        this.netSalary = calculateNetSalary();
    }

    public boolean isNetSalaryValid() {
        return netSalary != null && netSalary >= 0;
    }

    public boolean hasBonus() {
        return bonuses != null && bonuses > 0;
    }

    public boolean hasDeductions() {
        return deductions != null && deductions > 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Payroll payroll = (Payroll) o;
        return getId() != null && getId().equals(payroll.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Payroll{" +
                "id=" + getId() +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", payrollMonth='" + payrollMonth + '\'' +
                ", basicSalary=" + basicSalary +
                ", allowances=" + allowances +
                ", deductions=" + deductions +
                ", bonuses=" + bonuses +
                ", grossSalary=" + grossSalary +
                ", netSalary=" + netSalary +
                ", strategyName='" + strategyName + '\'' +
                '}';
    }
}