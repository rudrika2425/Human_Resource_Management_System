package com.hrms.department.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.department.dto.DepartmentRequest;
import com.hrms.department.dto.DepartmentResponse;
import com.hrms.department.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    // Constructor Injection
    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER','EMPLOYEE')")
    public ApiResponse<List<DepartmentResponse>> list() {
        return ApiResponse.success("Departments fetched", departmentService.list());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<DepartmentResponse> get(@PathVariable Long id) {
        return ApiResponse.success("Department fetched", departmentService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<DepartmentResponse> create(@Valid @RequestBody DepartmentRequest request) {
        return ApiResponse.success("Department created", departmentService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<DepartmentResponse> update(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return ApiResponse.success("Department updated", departmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return ApiResponse.success("Department deleted", null);
    }
}