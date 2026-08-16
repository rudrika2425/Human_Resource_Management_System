package com.hrms.employee.dto;

import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import com.hrms.auth.entity.UserRole;

public record EmployeeRequest(
        @NotBlank String employeeId,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email @NotBlank String email,
        String phone,
        String profileImageUrl,
        LocalDate dateOfBirth,
        String address,
        String emergencyContact,
        LocalDate joiningDate,
        Long departmentId,
        Long designationId,
        Long managerId,
        @NotNull EmploymentType employmentType,
        @NotNull EmploymentStatus employmentStatus,
        String workLocation,
        String skills,
        String education,
        String experience,
        Boolean active,
        @NotNull 
        UserRole assignedRole
        
) {
}
