package com.hrms.attendance.entity;

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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", indexes = {
        @Index(name = "idx_attendance_employee_workdate", columnList = "employee_id,workDate")
})
public class Attendance extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private LocalDate workDate;

    private LocalDateTime checkInAt;
    private LocalDateTime checkOutAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceStatus status;

    private Long workedMinutes;

    // Default constructor
    public Attendance() {
    }

    // Constructor with all fields
    public Attendance(Employee employee, LocalDate workDate, LocalDateTime checkInAt,
                      LocalDateTime checkOutAt, AttendanceStatus status, Long workedMinutes) {
        this.employee = employee;
        this.workDate = workDate;
        this.checkInAt = checkInAt;
        this.checkOutAt = checkOutAt;
        this.status = status;
        this.workedMinutes = workedMinutes;
    }

    // Getters
    public Employee getEmployee() {
        return employee;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public LocalDateTime getCheckInAt() {
        return checkInAt;
    }

    public LocalDateTime getCheckOutAt() {
        return checkOutAt;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public Long getWorkedMinutes() {
        return workedMinutes;
    }

    // Setters
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public void setCheckInAt(LocalDateTime checkInAt) {
        this.checkInAt = checkInAt;
    }

    public void setCheckOutAt(LocalDateTime checkOutAt) {
        this.checkOutAt = checkOutAt;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public void setWorkedMinutes(Long workedMinutes) {
        this.workedMinutes = workedMinutes;
    }

    // Builder pattern
    public static AttendanceBuilder builder() {
        return new AttendanceBuilder();
    }

    public static class AttendanceBuilder {
        private Employee employee;
        private LocalDate workDate;
        private LocalDateTime checkInAt;
        private LocalDateTime checkOutAt;
        private AttendanceStatus status;
        private Long workedMinutes;

        public AttendanceBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public AttendanceBuilder workDate(LocalDate workDate) {
            this.workDate = workDate;
            return this;
        }

        public AttendanceBuilder checkInAt(LocalDateTime checkInAt) {
            this.checkInAt = checkInAt;
            return this;
        }

        public AttendanceBuilder checkOutAt(LocalDateTime checkOutAt) {
            this.checkOutAt = checkOutAt;
            return this;
        }

        public AttendanceBuilder status(AttendanceStatus status) {
            this.status = status;
            return this;
        }

        public AttendanceBuilder workedMinutes(Long workedMinutes) {
            this.workedMinutes = workedMinutes;
            return this;
        }

        public Attendance build() {
            return new Attendance(employee, workDate, checkInAt, checkOutAt, status, workedMinutes);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Attendance that = (Attendance) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Attendance{" +
                "id=" + getId() +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", workDate=" + workDate +
                ", checkInAt=" + checkInAt +
                ", checkOutAt=" + checkOutAt +
                ", status=" + status +
                ", workedMinutes=" + workedMinutes +
                '}';
    }
}