package com.hrms.attendance.controller;

import com.hrms.attendance.dto.AttendanceResponse;
import com.hrms.attendance.dto.AttendanceSummaryResponse;
import com.hrms.attendance.service.AttendanceService;
import com.hrms.common.response.ApiResponse;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    
    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /*
     * ============================================================
     * AUTOMATIC / SELF CHECK-OUT
     * ============================================================
     */
    

    /*
     * Existing HR / Manager check-in.
     */
    @PostMapping("/check-in/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<AttendanceResponse> checkIn(
            @PathVariable Long employeeId
    ) {

        return ApiResponse.success(
                "Check-in successful",
                attendanceService.checkIn(employeeId)
        );
    }

    /*
     * Existing HR / Manager check-out.
     */
    @PostMapping("/check-out/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<AttendanceResponse> checkOut(
            @PathVariable Long employeeId
    ) {

        return ApiResponse.success(
                "Check-out successful",
                attendanceService.checkOut(employeeId)
        );
    }

    @GetMapping("/history/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ApiResponse<List<AttendanceResponse>> history(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        return ApiResponse.success(
                "Attendance history",
                attendanceService.history(
                        employeeId,
                        page,
                        size
                )
        );
    }

    @GetMapping("/summary/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<AttendanceSummaryResponse> summary(
            @PathVariable Long employeeId
    ) {

        return ApiResponse.success(
                "Attendance summary",
                attendanceService.monthlySummary(employeeId)
        );
    }

    @GetMapping("/my-history")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR')")
    public ApiResponse<List<AttendanceResponse>> myHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        return ApiResponse.success(
                "Attendance history",
                attendanceService.myHistory(
                        authentication.getName(),
                        page,
                        size
                )
        );
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<List<AttendanceResponse>> teamAttendance(
            Authentication authentication
    ) {

        return ApiResponse.success(
                "Team attendance",
                attendanceService.teamAttendance(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/all/today")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<List<AttendanceResponse>> allTodayAttendance() {

        return ApiResponse.success(
                "Today's attendance",
                attendanceService.allTodayAttendance()
        );
    }
    

    @GetMapping("/my/today")
        @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
        public ApiResponse<AttendanceResponse> myToday(Authentication authentication) {
        return ApiResponse.success(
                "Today's attendance",
                attendanceService.todayAttendance(authentication.getName())
        );
        }

        @PostMapping("/my/check-in")
        @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
        public ApiResponse<AttendanceResponse> myCheckIn(Authentication authentication) {
        return ApiResponse.success(
                "Check-in successful",
                attendanceService.checkInSelf(authentication.getName())   // was checkInForLogin
        );
        }

        @PostMapping("/my/check-out")
        @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
        public ApiResponse<AttendanceResponse> myCheckOut(Authentication authentication) {
        return ApiResponse.success(
                "Check-out successful",
                attendanceService.checkOutSelf(authentication.getName())   // was checkOutForLogout
        );
        }
}