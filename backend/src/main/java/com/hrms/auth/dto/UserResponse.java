package com.hrms.auth.dto;

import com.hrms.auth.entity.User;
import com.hrms.auth.entity.UserRole;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        boolean active,
        Set<UserRole> roles,
        Instant createdAt,
        Long employeeId,
        String employeeCode,
        String designation,
        String department,
        LocalDate dateOfBirth,
        String phone,
        String address,
        LocalDate joiningDate,
        Long departmentId,
        String departmentName,
        Long designationId,
        String designationName,
        Long managerId,
        String managerName,
        UserRole assignedRole,
        EmploymentType employmentType,
        EmploymentStatus employmentStatus,
        String workLocation,
        String skills,
        String education,
        String experience,
        String profileImageUrl
) {
    
    public UserResponse(User user, Employee employee) {
        this(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.isActive(),
            user.getRoles(),
            user.getCreatedAt(),
            employee != null ? employee.getId() : null,
            employee != null ? employee.getEmployeeId() : null,
            employee != null ? employee.getDesignation() != null ? employee.getDesignation().getName() : null : null,
            employee != null ? employee.getDepartment() != null ? employee.getDepartment().getName() : null : null,
            employee != null ? employee.getDateOfBirth() : null,
            employee != null ? employee.getPhone() : null,
            employee != null ? employee.getAddress() : null,
            employee != null ? employee.getJoiningDate() : null,
            employee != null && employee.getDepartment() != null ? employee.getDepartment().getId() : null,
            employee != null && employee.getDepartment() != null ? employee.getDepartment().getName() : null,
            employee != null && employee.getDesignation() != null ? employee.getDesignation().getId() : null,
            employee != null && employee.getDesignation() != null ? employee.getDesignation().getName() : null,
            employee != null && employee.getManager() != null ? employee.getManager().getId() : null,
            employee != null && employee.getManager() != null ? employee.getManager().getFirstName() + " " + employee.getManager().getLastName() : null,
            employee != null ? employee.getAssignedRole() : null,
            employee != null ? employee.getEmploymentType() : null,
            employee != null ? employee.getEmploymentStatus() : null,
            employee != null ? employee.getWorkLocation() : null,
            employee != null ? employee.getSkills() : null,
            employee != null ? employee.getEducation() : null,
            employee != null ? employee.getExperience() : null,
            employee != null ? employee.getProfileImageUrl() : null
        );
    }
}