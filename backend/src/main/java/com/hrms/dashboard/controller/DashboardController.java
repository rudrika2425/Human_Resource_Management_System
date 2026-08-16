package com.hrms.dashboard.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.dashboard.dto.EmployeeDashboardResponse;
import com.hrms.dashboard.dto.HrDashboardResponse;
import com.hrms.dashboard.dto.ManagerDashboardResponse;
import com.hrms.dashboard.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/hr")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<HrDashboardResponse> hr() {
        return ApiResponse.success("HR dashboard fetched", dashboardService.hrDashboard());
    }

    @GetMapping("/manager/{managerEmployeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<ManagerDashboardResponse> manager(@PathVariable Long managerEmployeeId) {
        return ApiResponse.success("Manager dashboard fetched", dashboardService.managerDashboard(managerEmployeeId));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<EmployeeDashboardResponse> employee(@PathVariable Long employeeId) {
        return ApiResponse.success("Employee dashboard fetched", dashboardService.employeeDashboard(employeeId));
    }
}