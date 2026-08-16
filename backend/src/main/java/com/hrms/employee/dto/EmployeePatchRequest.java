package com.hrms.employee.dto;

import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import java.time.LocalDate;

public record EmployeePatchRequest(
        String firstName,
        String lastName,
        String phone,
        String profileImageUrl,
        LocalDate dateOfBirth,
        String address,
        String emergencyContact,
        LocalDate joiningDate,
        Long departmentId,
        Long designationId,
        Long managerId,
        EmploymentType employmentType,
        EmploymentStatus employmentStatus,
        String workLocation,
        String skills,
        String education,
        String experience,
        Boolean active) {
}
