package com.hrms.payroll.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.employee.entity.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "salary_structures")
public class SalaryStructure extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Column(nullable = false)
    private Double basicSalary;

    @Column(nullable = false)
    private Double allowances;

    @Column(nullable = false)
    private Double deductions;

    @Column(nullable = false)
    private Double bonuses;

    // Default constructor
    public SalaryStructure() {
    }

    // Constructor with all fields
    public SalaryStructure(Employee employee, Double basicSalary, Double allowances,
                           Double deductions, Double bonuses) {
        this.employee = employee;
        this.basicSalary = basicSalary;
        this.allowances = allowances;
        this.deductions = deductions;
        this.bonuses = bonuses;
    }

    // Getters
    public Employee getEmployee() {
        return employee;
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

    // Setters
    public void setEmployee(Employee employee) {
        this.employee = employee;
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

    // Builder pattern
    public static SalaryStructureBuilder builder() {
        return new SalaryStructureBuilder();
    }

    public static class SalaryStructureBuilder {
        private Employee employee;
        private Double basicSalary;
        private Double allowances;
        private Double deductions;
        private Double bonuses;

        public SalaryStructureBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public SalaryStructureBuilder basicSalary(Double basicSalary) {
            this.basicSalary = basicSalary;
            return this;
        }

        public SalaryStructureBuilder allowances(Double allowances) {
            this.allowances = allowances;
            return this;
        }

        public SalaryStructureBuilder deductions(Double deductions) {
            this.deductions = deductions;
            return this;
        }

        public SalaryStructureBuilder bonuses(Double bonuses) {
            this.bonuses = bonuses;
            return this;
        }

        public SalaryStructure build() {
            return new SalaryStructure(employee, basicSalary, allowances, deductions, bonuses);
        }
    }

    // Business methods
    public Double calculateGrossSalary() {
        return basicSalary + allowances + bonuses;
    }

    public Double calculateNetSalary() {
        return calculateGrossSalary() - deductions;
    }

    public Double getTotalCompensation() {
        return calculateGrossSalary();
    }

    public Double getTakeHomePay() {
        return calculateNetSalary();
    }

    public boolean hasBonus() {
        return bonuses != null && bonuses > 0;
    }

    public boolean hasDeductions() {
        return deductions != null && deductions > 0;
    }

    public Double getDeductionPercentage() {
        if (calculateGrossSalary() == 0) {
            return 0.0;
        }
        return (deductions / calculateGrossSalary()) * 100;
    }

    public Double getBonusPercentage() {
        if (basicSalary == 0) {
            return 0.0;
        }
        return (bonuses / basicSalary) * 100;
    }

    public Double getAllowancePercentage() {
        if (basicSalary == 0) {
            return 0.0;
        }
        return (allowances / basicSalary) * 100;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SalaryStructure that = (SalaryStructure) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "SalaryStructure{" +
                "id=" + getId() +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", basicSalary=" + basicSalary +
                ", allowances=" + allowances +
                ", deductions=" + deductions +
                ", bonuses=" + bonuses +
                ", grossSalary=" + calculateGrossSalary() +
                ", netSalary=" + calculateNetSalary() +
                '}';
    }
}