package com.hrms.payroll.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.common.security.UserPrincipal;
import com.hrms.payroll.dto.PayrollGenerateRequest;
import com.hrms.payroll.dto.PayrollResponse;
import com.hrms.payroll.dto.SalaryStructureRequest;
import com.hrms.payroll.dto.SalaryStructureResponse;
import com.hrms.payroll.service.PayrollService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    
    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @PostMapping("/structure")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<SalaryStructureResponse> upsertStructure(@Valid @RequestBody SalaryStructureRequest request) {
        return ApiResponse.success("Salary structure saved", payrollService.upsertSalaryStructure(request));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<PayrollResponse> generate(@Valid @RequestBody PayrollGenerateRequest request) {
        return ApiResponse.success("Payroll generated", payrollService.generate(request));
    }

    @GetMapping("/history/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<List<PayrollResponse>> history(@PathVariable Long employeeId) {
        return ApiResponse.success("Payroll history", payrollService.history(employeeId));
    }

    @GetMapping("/structure/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<SalaryStructureResponse> structure(@PathVariable Long employeeId) {
        return ApiResponse.success("Salary structure", payrollService.getStructure(employeeId));
    }

    @GetMapping("/my-history")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<List<PayrollResponse>> myHistory(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return ApiResponse.success("My payroll history", payrollService.historyByUser(principal.getUsername()));
    }
}