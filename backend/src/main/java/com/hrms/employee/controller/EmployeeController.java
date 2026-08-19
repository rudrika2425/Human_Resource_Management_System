package com.hrms.employee.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.common.response.PageResponse;
import com.hrms.common.security.UserPrincipal;
import com.hrms.employee.dto.EmployeePatchRequest;
import com.hrms.employee.dto.EmployeeRequest;
import com.hrms.employee.dto.EmployeeResponse;
import com.hrms.employee.dto.ManagerResponse;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_HR')")
    public ApiResponse<EmployeeResponse> create(@Valid @RequestBody EmployeeRequest request) {
        return ApiResponse.success("Employee created", employeeService.create(request));
    }

    @GetMapping("/my-team")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<List<EmployeeResponse>> myTeam(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("My team fetched", employeeService.myTeam(principal));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER','EMPLOYEE')")
    public ApiResponse<EmployeeResponse> get(@PathVariable Long id) {
        return ApiResponse.success("Employee fetched", employeeService.get(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<PageResponse<EmployeeResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long designationId,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) EmploymentStatus employmentStatus,
            @RequestParam(required = false) String workLocation,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate joiningFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate joiningTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        return ApiResponse.success(
                "Employees fetched",
                employeeService.search(
                        keyword,
                        departmentId,
                        designationId,
                        managerId,
                        employmentStatus,
                        workLocation,
                        employmentType,
                        active,
                        joiningFrom,
                        joiningTo,
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<EmployeeResponse> update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return ApiResponse.success("Employee updated", employeeService.update(id, request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<EmployeeResponse> patch(@PathVariable Long id, @RequestBody EmployeePatchRequest request) {
        return ApiResponse.success("Employee patched", employeeService.patch(id, request));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<EmployeeResponse> activate(@PathVariable Long id) {
        return ApiResponse.success("Employee activated", employeeService.activate(id));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<EmployeeResponse> deactivate(@PathVariable Long id) {
        return ApiResponse.success("Employee deactivated", employeeService.deactivate(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<EmployeeResponse> delete(@PathVariable Long id) {
        return ApiResponse.success("Employee deleted", employeeService.delete(id));
    }
    

    @GetMapping("/{employeeId}/manager")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<ManagerResponse> manager(@PathVariable Long employeeId) {
        return ApiResponse.success("Manager", employeeService.getManager(employeeId));
    }
}