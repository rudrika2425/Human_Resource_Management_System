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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests", indexes = {
        @Index(name = "idx_leave_employee_dates", columnList = "employee_id,startDate,endDate")
})
public class LeaveRequest extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeaveType leaveType;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeaveStatus status;

    private Long approverId;
    private String approvalRemarks;
    private LocalDateTime approvedAt;
    private LocalDateTime cancelledAt;

    // Default constructor
    public LeaveRequest() {
    }

    // Constructor with all fields
    public LeaveRequest(Employee employee, LeaveType leaveType, LocalDate startDate,
                        LocalDate endDate, String reason, LeaveStatus status,
                        Long approverId, String approvalRemarks,
                        LocalDateTime approvedAt, LocalDateTime cancelledAt) {
        this.employee = employee;
        this.leaveType = leaveType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.reason = reason;
        this.status = status;
        this.approverId = approverId;
        this.approvalRemarks = approvalRemarks;
        this.approvedAt = approvedAt;
        this.cancelledAt = cancelledAt;
    }

    // Getters
    public Employee getEmployee() {
        return employee;
    }

    public LeaveType getLeaveType() {
        return leaveType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public String getReason() {
        return reason;
    }

    public LeaveStatus getStatus() {
        return status;
    }

    public Long getApproverId() {
        return approverId;
    }

    public String getApprovalRemarks() {
        return approvalRemarks;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    // Setters
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public void setLeaveType(LeaveType leaveType) {
        this.leaveType = leaveType;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setStatus(LeaveStatus status) {
        this.status = status;
    }

    public void setApproverId(Long approverId) {
        this.approverId = approverId;
    }

    public void setApprovalRemarks(String approvalRemarks) {
        this.approvalRemarks = approvalRemarks;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    // Builder pattern
    public static LeaveRequestBuilder builder() {
        return new LeaveRequestBuilder();
    }

    public static class LeaveRequestBuilder {
        private Employee employee;
        private LeaveType leaveType;
        private LocalDate startDate;
        private LocalDate endDate;
        private String reason;
        private LeaveStatus status;
        private Long approverId;
        private String approvalRemarks;
        private LocalDateTime approvedAt;
        private LocalDateTime cancelledAt;

        public LeaveRequestBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public LeaveRequestBuilder leaveType(LeaveType leaveType) {
            this.leaveType = leaveType;
            return this;
        }

        public LeaveRequestBuilder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public LeaveRequestBuilder endDate(LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public LeaveRequestBuilder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public LeaveRequestBuilder status(LeaveStatus status) {
            this.status = status;
            return this;
        }

        public LeaveRequestBuilder approverId(Long approverId) {
            this.approverId = approverId;
            return this;
        }

        public LeaveRequestBuilder approvalRemarks(String approvalRemarks) {
            this.approvalRemarks = approvalRemarks;
            return this;
        }

        public LeaveRequestBuilder approvedAt(LocalDateTime approvedAt) {
            this.approvedAt = approvedAt;
            return this;
        }

        public LeaveRequestBuilder cancelledAt(LocalDateTime cancelledAt) {
            this.cancelledAt = cancelledAt;
            return this;
        }

        public LeaveRequest build() {
            return new LeaveRequest(employee, leaveType, startDate, endDate, reason,
                    status, approverId, approvalRemarks, approvedAt, cancelledAt);
        }
    }

    // Business methods
    public long getNumberOfDays() {
        if (startDate == null || endDate == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    public boolean isPending() {
        return status == LeaveStatus.PENDING;
    }

    public boolean isApproved() {
        return status == LeaveStatus.APPROVED;
    }

    public boolean isRejected() {
        return status == LeaveStatus.REJECTED;
    }

    public boolean isCancelled() {
        return status == LeaveStatus.CANCELLED;
    }

    public boolean isActive() {
        return status == LeaveStatus.PENDING || status == LeaveStatus.APPROVED;
    }

    public boolean canBeCancelled() {
        return status == LeaveStatus.PENDING || status == LeaveStatus.APPROVED;
    }

    public boolean canBeApproved() {
        return status == LeaveStatus.PENDING;
    }

    public boolean canBeRejected() {
        return status == LeaveStatus.PENDING;
    }

    public void approve(Long approverId, String remarks) {
        if (canBeApproved()) {
            this.status = LeaveStatus.APPROVED;
            this.approverId = approverId;
            this.approvalRemarks = remarks;
            this.approvedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Leave request cannot be approved. Current status: " + status);
        }
    }

    public void reject(Long approverId, String remarks) {
        if (canBeRejected()) {
            this.status = LeaveStatus.REJECTED;
            this.approverId = approverId;
            this.approvalRemarks = remarks;
        } else {
            throw new IllegalStateException("Leave request cannot be rejected. Current status: " + status);
        }
    }

    public void cancel() {
        if (canBeCancelled()) {
            this.status = LeaveStatus.CANCELLED;
            this.cancelledAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Leave request cannot be cancelled. Current status: " + status);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LeaveRequest that = (LeaveRequest) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "LeaveRequest{" +
                "id=" + getId() +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", leaveType=" + leaveType +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", numberOfDays=" + getNumberOfDays() +
                ", status=" + status +
                ", approverId=" + approverId +
                ", approvedAt=" + approvedAt +
                '}';
    }
}