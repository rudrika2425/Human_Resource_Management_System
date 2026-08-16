package com.hrms.employee.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hrms.auth.entity.User;
import jakarta.persistence.OneToOne;
import com.hrms.common.entity.AuditableEntity;
import com.hrms.department.entity.Department;
import com.hrms.designation.entity.Designation;
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
import com.hrms.auth.entity.UserRole;

@Entity
@Table(name = "employees", indexes = {
        @Index(name = "idx_employee_employee_id", columnList = "employeeId"),
        @Index(name = "idx_employee_email", columnList = "email"),
        @Index(name = "idx_employee_status", columnList = "employmentStatus")
})
public class Employee extends AuditableEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String employeeId;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String profileImageUrl;

    private LocalDate dateOfBirth;

    @Column(length = 500)
    private String address;

    @Column(length = 250)
    private String emergencyContact;

    private LocalDate joiningDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "designation_id")
    private Designation designation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    @JsonIgnore
    private Employee manager;

    @Enumerated(EnumType.STRING)
    @Column(name = "assigned_role", nullable = false, length = 30)
    private UserRole assignedRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmploymentStatus employmentStatus;

    @Column(length = 100)
    private String workLocation;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String education;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private boolean deleted;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    @JsonIgnore
    private User user;

    // Default constructor
    public Employee() {
    }

    // Constructor with all fields
    public Employee(String employeeId, String firstName, String lastName, String email,
                    String phone, String profileImageUrl, LocalDate dateOfBirth,
                    String address, String emergencyContact, LocalDate joiningDate,
                    Department department, Designation designation, Employee manager,
                    UserRole assignedRole, EmploymentType employmentType,
                    EmploymentStatus employmentStatus, String workLocation,
                    String skills, String education, String experience,
                    boolean active, boolean deleted, User user) {
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.profileImageUrl = profileImageUrl;
        this.dateOfBirth = dateOfBirth;
        this.address = address;
        this.emergencyContact = emergencyContact;
        this.joiningDate = joiningDate;
        this.department = department;
        this.designation = designation;
        this.manager = manager;
        this.assignedRole = assignedRole;
        this.employmentType = employmentType;
        this.employmentStatus = employmentStatus;
        this.workLocation = workLocation;
        this.skills = skills;
        this.education = education;
        this.experience = experience;
        this.active = active;
        this.deleted = deleted;
        this.user = user;
    }

    // Getters
    public String getEmployeeId() {
        return employeeId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getAddress() {
        return address;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public Department getDepartment() {
        return department;
    }

    public Designation getDesignation() {
        return designation;
    }

    public Employee getManager() {
        return manager;
    }

    public UserRole getAssignedRole() {
        return assignedRole;
    }

    public EmploymentType getEmploymentType() {
        return employmentType;
    }

    public EmploymentStatus getEmploymentStatus() {
        return employmentStatus;
    }

    public String getWorkLocation() {
        return workLocation;
    }

    public String getSkills() {
        return skills;
    }

    public String getEducation() {
        return education;
    }

    public String getExperience() {
        return experience;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public User getUser() {
        return user;
    }

    // Setters
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public void setDesignation(Designation designation) {
        this.designation = designation;
    }

    public void setManager(Employee manager) {
        this.manager = manager;
    }

    public void setAssignedRole(UserRole assignedRole) {
        this.assignedRole = assignedRole;
    }

    public void setEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }

    public void setEmploymentStatus(EmploymentStatus employmentStatus) {
        this.employmentStatus = employmentStatus;
    }

    public void setWorkLocation(String workLocation) {
        this.workLocation = workLocation;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public void setUser(User user) {
        this.user = user;
    }

    // Builder pattern
    public static EmployeeBuilder builder() {
        return new EmployeeBuilder();
    }

    public static class EmployeeBuilder {
        private String employeeId;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String profileImageUrl;
        private LocalDate dateOfBirth;
        private String address;
        private String emergencyContact;
        private LocalDate joiningDate;
        private Department department;
        private Designation designation;
        private Employee manager;
        private UserRole assignedRole;
        private EmploymentType employmentType;
        private EmploymentStatus employmentStatus;
        private String workLocation;
        private String skills;
        private String education;
        private String experience;
        private boolean active;
        private boolean deleted;
        private User user;

        public EmployeeBuilder employeeId(String employeeId) {
            this.employeeId = employeeId;
            return this;
        }

        public EmployeeBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public EmployeeBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public EmployeeBuilder email(String email) {
            this.email = email;
            return this;
        }

        public EmployeeBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public EmployeeBuilder profileImageUrl(String profileImageUrl) {
            this.profileImageUrl = profileImageUrl;
            return this;
        }

        public EmployeeBuilder dateOfBirth(LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
            return this;
        }

        public EmployeeBuilder address(String address) {
            this.address = address;
            return this;
        }

        public EmployeeBuilder emergencyContact(String emergencyContact) {
            this.emergencyContact = emergencyContact;
            return this;
        }

        public EmployeeBuilder joiningDate(LocalDate joiningDate) {
            this.joiningDate = joiningDate;
            return this;
        }

        public EmployeeBuilder department(Department department) {
            this.department = department;
            return this;
        }

        public EmployeeBuilder designation(Designation designation) {
            this.designation = designation;
            return this;
        }

        public EmployeeBuilder manager(Employee manager) {
            this.manager = manager;
            return this;
        }

        public EmployeeBuilder assignedRole(UserRole assignedRole) {
            this.assignedRole = assignedRole;
            return this;
        }

        public EmployeeBuilder employmentType(EmploymentType employmentType) {
            this.employmentType = employmentType;
            return this;
        }

        public EmployeeBuilder employmentStatus(EmploymentStatus employmentStatus) {
            this.employmentStatus = employmentStatus;
            return this;
        }

        public EmployeeBuilder workLocation(String workLocation) {
            this.workLocation = workLocation;
            return this;
        }

        public EmployeeBuilder skills(String skills) {
            this.skills = skills;
            return this;
        }

        public EmployeeBuilder education(String education) {
            this.education = education;
            return this;
        }

        public EmployeeBuilder experience(String experience) {
            this.experience = experience;
            return this;
        }

        public EmployeeBuilder active(boolean active) {
            this.active = active;
            return this;
        }

        public EmployeeBuilder deleted(boolean deleted) {
            this.deleted = deleted;
            return this;
        }

        public EmployeeBuilder user(User user) {
            this.user = user;
            return this;
        }

        public Employee build() {
            return new Employee(employeeId, firstName, lastName, email,
                    phone, profileImageUrl, dateOfBirth, address,
                    emergencyContact, joiningDate, department, designation,
                    manager, assignedRole, employmentType, employmentStatus,
                    workLocation, skills, education, experience,
                    active, deleted, user);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Employee employee = (Employee) o;
        return employeeId != null && employeeId.equals(employee.employeeId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    public Long getManagerId() {
    return manager != null ? manager.getId() : null;
}

    @Override
    public String toString() {
        return "Employee{" +
                "employeeId='" + employeeId + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", assignedRole=" + assignedRole +
                ", employmentStatus=" + employmentStatus +
                ", active=" + active +
                '}';
    }
}