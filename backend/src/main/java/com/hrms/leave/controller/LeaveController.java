package com.hrms.leave.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.leave.dto.LeaveActionDto;
import com.hrms.leave.dto.LeaveBalanceResponse;
import com.hrms.leave.dto.LeaveRequestDto;
import com.hrms.leave.dto.LeaveResponse;
import com.hrms.leave.entity.LeaveType;
import com.hrms.leave.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    // Constructor Injection - NO @Autowired or @RequiredArgsConstructor needed
    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<LeaveResponse> apply(@Valid @RequestBody LeaveRequestDto request) {
        return ApiResponse.success("Leave applied", leaveService.apply(request));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<LeaveResponse> approve(@PathVariable Long id, @Valid @RequestBody LeaveActionDto action) {
        return ApiResponse.success("Leave approved", leaveService.approve(id, action));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<LeaveResponse> reject(@PathVariable Long id, @Valid @RequestBody LeaveActionDto action) {
        return ApiResponse.success("Leave rejected", leaveService.reject(id, action));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<LeaveResponse> cancel(@PathVariable Long id) {
        return ApiResponse.success("Leave cancelled", leaveService.cancel(id));
    }

    @GetMapping("/history/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<List<LeaveResponse>> history(@PathVariable Long employeeId) {
        return ApiResponse.success("Leave history", leaveService.history(employeeId));
    }

    @GetMapping("/balance/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<LeaveBalanceResponse> balance(@PathVariable Long employeeId, @RequestParam LeaveType leaveType) {
        return ApiResponse.success("Leave balance", leaveService.balance(employeeId, leaveType));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<List<LeaveResponse>> pendingLeaves() {
        return ApiResponse.success("Pending leaves", leaveService.pendingLeaves());
    }
    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<List<LeaveResponse>> teamLeaves(@RequestParam Long managerId) {
        return ApiResponse.success("Team leaves", leaveService.teamLeaves(managerId));
    }
    
}