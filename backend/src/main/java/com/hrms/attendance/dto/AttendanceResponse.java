package com.hrms.attendance.dto;

import com.hrms.attendance.entity.AttendanceStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceResponse(
        Long id,
        Long employeeId,
        String employeeName,
        LocalDate workDate,
        LocalDateTime checkInAt,
        LocalDateTime checkOutAt,
        AttendanceStatus status,
        Long workedMinutes) {
}
