package com.hrms.designation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DesignationRequest(
        @NotBlank String name,
        @NotNull Long departmentId,
        String description,
        @NotNull Integer level,
        Boolean active) {
}
