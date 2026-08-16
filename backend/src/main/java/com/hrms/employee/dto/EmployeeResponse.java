package com.hrms.employee.dto;

import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import java.time.Instant;
import java.time.LocalDate;

import com.hrms.auth.entity.UserRole;

public record EmployeeResponse(
        Long id,
        String employeeId,
        String firstName,
        String lastName,
        String email,
        String phone,
        String profileImageUrl,
        LocalDate dateOfBirth,
        String address,
        String emergencyContact,
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
        boolean active,
        boolean deleted,
        Instant createdAt,
        Instant updatedAt) {
}
