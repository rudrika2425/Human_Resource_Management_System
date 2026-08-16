package com.hrms.designation.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.department.entity.Department;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "designations", indexes = @Index(name = "idx_designation_name", columnList = "name"))
public class Designation extends AuditableEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false)
    private boolean active;

    // Default constructor
    public Designation() {
    }

    // Constructor with all fields
    public Designation(String name, Department department, String description, Integer level, boolean active) {
        this.name = name;
        this.department = department;
        this.description = description;
        this.level = level;
        this.active = active;
    }

    // Getters
    public String getName() {
        return name;
    }

    public Department getDepartment() {
        return department;
    }

    public String getDescription() {
        return description;
    }

    public Integer getLevel() {
        return level;
    }

    public boolean isActive() {
        return active;
    }

    // Setters
    public void setName(String name) {
        this.name = name;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // Builder pattern
    public static DesignationBuilder builder() {
        return new DesignationBuilder();
    }

    public static class DesignationBuilder {
        private String name;
        private Department department;
        private String description;
        private Integer level;
        private boolean active;

        public DesignationBuilder name(String name) {
            this.name = name;
            return this;
        }

        public DesignationBuilder department(Department department) {
            this.department = department;
            return this;
        }

        public DesignationBuilder description(String description) {
            this.description = description;
            return this;
        }

        public DesignationBuilder level(Integer level) {
            this.level = level;
            return this;
        }

        public DesignationBuilder active(boolean active) {
            this.active = active;
            return this;
        }

        public Designation build() {
            return new Designation(name, department, description, level, active);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Designation that = (Designation) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Designation{" +
                "id=" + getId() +
                ", name='" + name + '\'' +
                ", departmentId=" + (department != null ? department.getId() : null) +
                ", description='" + description + '\'' +
                ", level=" + level +
                ", active=" + active +
                '}';
    }
}