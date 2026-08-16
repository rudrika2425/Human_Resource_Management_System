package com.hrms.performance.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.employee.entity.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "goals")
public class Goal extends AuditableEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String target;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PriorityLevel priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(30) DEFAULT 'NOT_STARTED'")
    private GoalStatus status = GoalStatus.NOT_STARTED;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    // Default constructor
    public Goal() {
    }

    // Constructor with all fields
    public Goal(String title, String description, String target, LocalDate dueDate,
                PriorityLevel priority, GoalStatus status, Employee employee, Employee manager) {
        this.title = title;
        this.description = description;
        this.target = target;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
        this.employee = employee;
        this.manager = manager;
    }

    // Getters
    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getTarget() {
        return target;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public PriorityLevel getPriority() {
        return priority;
    }

    public GoalStatus getStatus() {
        return status;
    }

    public Employee getEmployee() {
        return employee;
    }

    public Employee getManager() {
        return manager;
    }

    // Setters
    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public void setPriority(PriorityLevel priority) {
        this.priority = priority;
    }

    public void setStatus(GoalStatus status) {
        this.status = status;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public void setManager(Employee manager) {
        this.manager = manager;
    }

    // Builder pattern
    public static GoalBuilder builder() {
        return new GoalBuilder();
    }

    public static class GoalBuilder {
        private String title;
        private String description;
        private String target;
        private LocalDate dueDate;
        private PriorityLevel priority;
        private GoalStatus status;
        private Employee employee;
        private Employee manager;

        public GoalBuilder title(String title) {
            this.title = title;
            return this;
        }

        public GoalBuilder description(String description) {
            this.description = description;
            return this;
        }

        public GoalBuilder target(String target) {
            this.target = target;
            return this;
        }

        public GoalBuilder dueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
            return this;
        }

        public GoalBuilder priority(PriorityLevel priority) {
            this.priority = priority;
            return this;
        }

        public GoalBuilder status(GoalStatus status) {
            this.status = status;
            return this;
        }

        public GoalBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public GoalBuilder manager(Employee manager) {
            this.manager = manager;
            return this;
        }

        public Goal build() {
            return new Goal(title, description, target, dueDate, priority, status, employee, manager);
        }
    }

    // Business methods
    public boolean isOverdue() {
        return LocalDate.now().isAfter(dueDate) && status != GoalStatus.COMPLETED;
    }

    public boolean isCompleted() {
        return status == GoalStatus.COMPLETED;
    }

    public boolean isInProgress() {
        return status == GoalStatus.IN_PROGRESS;
    }

    public boolean isNotStarted() {
        return status == GoalStatus.NOT_STARTED;
    }

    public boolean canBeEdited() {
        return status == GoalStatus.NOT_STARTED || status == GoalStatus.IN_PROGRESS;
    }

    public void markAsInProgress() {
        if (status == GoalStatus.NOT_STARTED) {
            this.status = GoalStatus.IN_PROGRESS;
        } else {
            throw new IllegalStateException("Cannot mark goal as in progress. Current status: " + status);
        }
    }

    public void markAsCompleted() {
        if (status == GoalStatus.IN_PROGRESS || status == GoalStatus.NOT_STARTED) {
            this.status = GoalStatus.COMPLETED;
        } else {
            throw new IllegalStateException("Cannot mark goal as completed. Current status: " + status);
        }
    }

    public void markAsOnHold() {
        if (status == GoalStatus.IN_PROGRESS || status == GoalStatus.NOT_STARTED) {
            this.status = GoalStatus.ON_HOLD;
        } else {
            throw new IllegalStateException("Cannot mark goal as on hold. Current status: " + status);
        }
    }

    public void cancel() {
        if (status != GoalStatus.COMPLETED) {
            this.status = GoalStatus.CANCELLED;
        } else {
            throw new IllegalStateException("Cannot cancel a completed goal");
        }
    }

    public int getDaysUntilDue() {
        return (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
    }

    public boolean isDueSoon(int daysThreshold) {
        return getDaysUntilDue() <= daysThreshold && !isOverdue() && !isCompleted();
    }

    public boolean isAssignedToEmployee(Long employeeId) {
        return employee != null && employee.getId() != null && employee.getId().equals(employeeId);
    }

    public boolean isManagedBy(Long managerId) {
        return manager != null && manager.getId() != null && manager.getId().equals(managerId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Goal goal = (Goal) o;
        return getId() != null && getId().equals(goal.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Goal{" +
                "id=" + getId() +
                ", title='" + title + '\'' +
                ", dueDate=" + dueDate +
                ", priority=" + priority +
                ", status=" + status +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", managerId=" + (manager != null ? manager.getId() : null) +
                ", isOverdue=" + isOverdue() +
                ", daysUntilDue=" + getDaysUntilDue() +
                '}';
    }
}