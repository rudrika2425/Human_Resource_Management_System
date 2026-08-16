package com.hrms.department.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.employee.entity.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "departments", indexes = @Index(name = "idx_department_name", columnList = "name"))
public class Department extends AuditableEntity {

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(nullable = false)
    private boolean active;

    // Default constructor
    public Department() {
    }

    // Constructor with all fields
    public Department(String name, String description, Employee manager, boolean active) {
        this.name = name;
        this.description = description;
        this.manager = manager;
        this.active = active;
    }

    // Getters
    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Employee getManager() {
        return manager;
    }

    public boolean isActive() {
        return active;
    }

    // Setters
    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setManager(Employee manager) {
        this.manager = manager;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // Builder pattern
    public static DepartmentBuilder builder() {
        return new DepartmentBuilder();
    }

    public static class DepartmentBuilder {
        private String name;
        private String description;
        private Employee manager;
        private boolean active;

        public DepartmentBuilder name(String name) {
            this.name = name;
            return this;
        }

        public DepartmentBuilder description(String description) {
            this.description = description;
            return this;
        }

        public DepartmentBuilder manager(Employee manager) {
            this.manager = manager;
            return this;
        }

        public DepartmentBuilder active(boolean active) {
            this.active = active;
            return this;
        }

        public Department build() {
            return new Department(name, description, manager, active);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Department that = (Department) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Department{" +
                "id=" + getId() +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", managerId=" + (manager != null ? manager.getId() : null) +
                ", active=" + active +
                '}';
    }
}