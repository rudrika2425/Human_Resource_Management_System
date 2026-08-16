package com.hrms.performance.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.performance.dto.GoalRequest;
import com.hrms.performance.dto.GoalResponse;
import com.hrms.performance.dto.GoalStatusUpdateRequest;
import com.hrms.performance.dto.PerformanceReviewRequest;
import com.hrms.performance.dto.PerformanceReviewResponse;
import com.hrms.performance.service.PerformanceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PerformanceController {

    private final PerformanceService performanceService;

    
    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }

    
    
    

    @PostMapping("/goals")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<GoalResponse> createGoal(@Valid @RequestBody GoalRequest request) {
        return ApiResponse.success("Goal created", performanceService.createGoal(request));
    }

    @GetMapping("/goals")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<List<GoalResponse>> goals() {
        return ApiResponse.success("Goals fetched", performanceService.goals());
    }

    @PatchMapping("/goals/{goalId}/status")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<GoalResponse> updateGoalStatus(
            @PathVariable Long goalId,
            @RequestBody GoalStatusUpdateRequest request) {
        return ApiResponse.success("Goal status updated", 
                performanceService.updateGoalStatus(goalId, request.getStatus()));
    }

    @GetMapping("/goals/{goalId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<GoalResponse> getGoal(@PathVariable Long goalId) {
        return ApiResponse.success("Goal fetched", performanceService.getGoal(goalId));
    }

    @PutMapping("/goals/{goalId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<GoalResponse> updateGoal(
            @PathVariable Long goalId,
            @Valid @RequestBody GoalRequest request) {
        return ApiResponse.success("Goal updated", performanceService.updateGoal(goalId, request));
    }

    @DeleteMapping("/goals/{goalId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<Void> deleteGoal(@PathVariable Long goalId) {
        performanceService.deleteGoal(goalId);
        return ApiResponse.success("Goal deleted", null);
    }

    
    
    

    @PostMapping("/performance-reviews")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")  
    public ApiResponse<PerformanceReviewResponse> createReview(@Valid @RequestBody PerformanceReviewRequest request) {
        return ApiResponse.success("Performance review saved", performanceService.createReview(request));
    }

    @GetMapping("/performance-reviews")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER','EMPLOYEE')")
    public ApiResponse<List<PerformanceReviewResponse>> reviews() {
        return ApiResponse.success("Reviews fetched", performanceService.reviews());
    }

    @GetMapping("/performance-reviews/{reviewId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<PerformanceReviewResponse> getReview(@PathVariable Long reviewId) {
        return ApiResponse.success("Review fetched", performanceService.getReview(reviewId));
    }

    @PutMapping("/performance-reviews/{reviewId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<PerformanceReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody PerformanceReviewRequest request) {
        return ApiResponse.success("Review updated", performanceService.updateReview(reviewId, request));
    }

    @DeleteMapping("/performance-reviews/{reviewId}")
    @PreAuthorize("hasRole('HR')")  
    public ApiResponse<Void> deleteReview(@PathVariable Long reviewId) {
        performanceService.deleteReview(reviewId);
        return ApiResponse.success("Review deleted", null);
    }

    
    
    

    @GetMapping("/employees/{employeeId}/performance-summary")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<Object> getEmployeePerformanceSummary(@PathVariable Long employeeId) {
        return ApiResponse.success("Performance summary fetched", 
                performanceService.getEmployeePerformanceSummary(employeeId));
    }
}