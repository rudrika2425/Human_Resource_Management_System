package com.hrms.leave.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.employee.entity.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "leave_balances", indexes = {
        @Index(name = "idx_leave_balance_employee_type", columnList = "employee_id,leaveType")
})
public class LeaveBalance extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeaveType leaveType;

    @Column(nullable = false)
    private Integer availableDays;

    @Column(nullable = false)
    private Integer usedDays;

    // Default constructor
    public LeaveBalance() {
    }

    // Constructor with all fields
    public LeaveBalance(Employee employee, LeaveType leaveType, Integer availableDays, Integer usedDays) {
        this.employee = employee;
        this.leaveType = leaveType;
        this.availableDays = availableDays;
        this.usedDays = usedDays;
    }

    // Getters
    public Employee getEmployee() {
        return employee;
    }

    public LeaveType getLeaveType() {
        return leaveType;
    }

    public Integer getAvailableDays() {
        return availableDays;
    }

    public Integer getUsedDays() {
        return usedDays;
    }

    // Setters
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public void setLeaveType(LeaveType leaveType) {
        this.leaveType = leaveType;
    }

    public void setAvailableDays(Integer availableDays) {
        this.availableDays = availableDays;
    }

    public void setUsedDays(Integer usedDays) {
        this.usedDays = usedDays;
    }

    // Builder pattern
    public static LeaveBalanceBuilder builder() {
        return new LeaveBalanceBuilder();
    }

    public static class LeaveBalanceBuilder {
        private Employee employee;
        private LeaveType leaveType;
        private Integer availableDays;
        private Integer usedDays;

        public LeaveBalanceBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public LeaveBalanceBuilder leaveType(LeaveType leaveType) {
            this.leaveType = leaveType;
            return this;
        }

        public LeaveBalanceBuilder availableDays(Integer availableDays) {
            this.availableDays = availableDays;
            return this;
        }

        public LeaveBalanceBuilder usedDays(Integer usedDays) {
            this.usedDays = usedDays;
            return this;
        }

        public LeaveBalance build() {
            return new LeaveBalance(employee, leaveType, availableDays, usedDays);
        }
    }

    // Business methods
    public Integer getRemainingDays() {
        return availableDays - usedDays;
    }

    public boolean hasAvailableLeave() {
        return getRemainingDays() > 0;
    }

    public boolean hasSufficientLeave(Integer requestedDays) {
        return requestedDays != null && getRemainingDays() >= requestedDays;
    }

    public void deductLeave(Integer days) {
        if (days != null && days > 0 && hasSufficientLeave(days)) {
            this.usedDays += days;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LeaveBalance that = (LeaveBalance) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "LeaveBalance{" +
                "id=" + getId() +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", leaveType=" + leaveType +
                ", availableDays=" + availableDays +
                ", usedDays=" + usedDays +
                ", remainingDays=" + getRemainingDays() +
                '}';
    }
}