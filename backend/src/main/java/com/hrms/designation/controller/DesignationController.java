package com.hrms.designation.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.designation.dto.DesignationRequest;
import com.hrms.designation.dto.DesignationResponse;
import com.hrms.designation.service.DesignationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/designations")
public class DesignationController {

    private final DesignationService designationService;

    
    public DesignationController(DesignationService designationService) {
        this.designationService = designationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER','EMPLOYEE')")
    public ApiResponse<List<DesignationResponse>> list() {
        return ApiResponse.success("Designations fetched", designationService.list());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<DesignationResponse> get(@PathVariable Long id) {
        return ApiResponse.success("Designation fetched", designationService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<DesignationResponse> create(@Valid @RequestBody DesignationRequest request) {
        return ApiResponse.success("Designation created", designationService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<DesignationResponse> update(@PathVariable Long id, @Valid @RequestBody DesignationRequest request) {
        return ApiResponse.success("Designation updated", designationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<DesignationResponse> delete(@PathVariable Long id) {
        return ApiResponse.success("Designation deleted", designationService.delete(id));
    }
}