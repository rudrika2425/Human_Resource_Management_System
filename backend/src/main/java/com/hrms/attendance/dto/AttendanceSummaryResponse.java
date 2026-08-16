package com.hrms.attendance.dto;

public record AttendanceSummaryResponse(long present, long late, long halfDay, long absent, long onLeave) {
}
