package com.hrms.attendance.service;

import com.hrms.attendance.dto.AttendanceResponse;
import com.hrms.attendance.dto.AttendanceSummaryResponse;
import com.hrms.attendance.entity.Attendance;
import com.hrms.attendance.entity.AttendanceStatus;
import com.hrms.attendance.repository.AttendanceRepository;
import com.hrms.common.exception.ConflictException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.repository.EmployeeRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    
    public AttendanceService(AttendanceRepository attendanceRepository, 
                            EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }

    /*
     * ============================================================
     * AUTOMATIC CHECK-IN
     *
     * Called automatically after successful login.
     *
     * LOGIN
     *   ↓
     * Authentication successful
     *   ↓
     * checkInForLogin()
     *   ↓
     * Attendance record created
     * ============================================================
     */
    public AttendanceResponse checkInForLogin(String email) {

        Employee employee = findActiveEmployeeByEmail(email);

        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository
                .findByEmployee_IdAndWorkDate(employee.getId(), today)
                .orElse(null);

        /*
         * No attendance record for today.
         * Create the first attendance record.
         */
        if (attendance == null) {

            LocalDateTime checkInAt = LocalDateTime.now();

            attendance = new Attendance();
            attendance.setEmployee(employee);
            attendance.setWorkDate(today);
            attendance.setCheckInAt(checkInAt);
            attendance.setWorkedMinutes(0L);
            attendance.setStatus(isLate(checkInAt) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT);

            return toResponse(attendanceRepository.save(attendance));
        }

        /*
         * Employee is already logged in.
         *
         * Do NOT throw 409.
         * This can happen if login/authentication is triggered
         * again while the current session is still active.
         */
        if (attendance.getCheckInAt() != null && attendance.getCheckOutAt() == null) {
            return toResponse(attendance);
        }

        /*
         * Employee previously logged out today.
         *
         * Start another work session using the SAME
         * attendance record.
         *
         * Previous workedMinutes are preserved.
         */
        LocalDateTime checkInAt = LocalDateTime.now();

        attendance.setCheckInAt(checkInAt);
        attendance.setCheckOutAt(null);

        /*
         * Preserve accumulated worked time.
         */
        if (attendance.getWorkedMinutes() == null) {
            attendance.setWorkedMinutes(0L);
        }

        /*
         * If any session starts late, mark it LATE.
         * Otherwise preserve the existing status unless
         * it was only a previous half-day calculation.
         */
        if (isLate(checkInAt)) {
            attendance.setStatus(AttendanceStatus.LATE);
        } else if (attendance.getStatus() == AttendanceStatus.HALF_DAY) {
            attendance.setStatus(AttendanceStatus.PRESENT);
        }

        return toResponse(attendanceRepository.save(attendance));
    }

    /*
     * ============================================================
     * AUTOMATIC CHECK-OUT
     *
     * Called automatically before logout.
     *
     * LOGOUT
     *   ↓
     * checkOutForLogout()
     *   ↓
     * checkOutAt = current time
     *   ↓
     * workedMinutes calculated
     *   ↓
     * refresh token revoked
     * ============================================================
     */
    public AttendanceResponse checkOutForLogout(String email) {

        Employee employee = findActiveEmployeeByEmail(email);

        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository
                .findByEmployee_IdAndWorkDate(employee.getId(), today)
                .orElse(null);

        /*
         * No attendance record.
         */
        if (attendance == null) {
            return null;
        }

        /*
         * Nothing to checkout.
         */
        if (attendance.getCheckInAt() == null) {
            return toResponse(attendance);
        }

        /*
         * Already logged out.
         */
        if (attendance.getCheckOutAt() != null) {
            return toResponse(attendance);
        }

        LocalDateTime checkOutAt = LocalDateTime.now();

        if (checkOutAt.isBefore(attendance.getCheckInAt())) {
            throw new ConflictException("Checkout cannot be before check-in");
        }

        /*
         * Calculate THIS login session.
         */
        long currentSessionMinutes = Duration
                .between(attendance.getCheckInAt(), checkOutAt)
                .toMinutes();

        /*
         * Get previously accumulated time.
         */
        long previousMinutes = attendance.getWorkedMinutes() == null ? 0L : attendance.getWorkedMinutes();

        /*
         * Add current session to previous sessions.
         */
        long totalWorkedMinutes = previousMinutes + currentSessionMinutes;

        attendance.setCheckOutAt(checkOutAt);
        attendance.setWorkedMinutes(totalWorkedMinutes);

        /*
         * Determine final status from TOTAL worked time.
         */
        if (totalWorkedMinutes < 240) {

            /*
             * Preserve LATE if employee arrived late.
             */
            if (attendance.getStatus() != AttendanceStatus.LATE) {
                attendance.setStatus(AttendanceStatus.HALF_DAY);
            }

        } else {

            /*
             * Once 4+ hours have been worked,
             * employee is considered PRESENT.
             *
             * If you want LATE to remain visible,
             * keep LATE instead.
             */
            if (attendance.getStatus() != AttendanceStatus.LATE) {
                attendance.setStatus(AttendanceStatus.PRESENT);
            }
        }

        return toResponse(attendanceRepository.save(attendance));
    }

    /*
     * ============================================================
     * MANUAL CHECK-IN
     *
     * Kept for HR/Manager functionality.
     * Your existing Attendance page will continue to work.
     * ============================================================
     */
    public AttendanceResponse checkIn(Long employeeId) {

        Employee employee = findActiveEmployee(employeeId);

        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository
                .findByEmployee_IdAndWorkDate(employeeId, today)
                .orElse(null);

        if (attendance != null && attendance.getCheckInAt() != null) {
            throw new ConflictException("Employee already checked in today");
        }

        if (attendance == null) {
            attendance = new Attendance();
            attendance.setEmployee(employee);
            attendance.setWorkDate(today);
        }

        LocalDateTime checkInAt = LocalDateTime.now();

        attendance.setCheckInAt(checkInAt);
        attendance.setCheckOutAt(null);
        attendance.setWorkedMinutes(null);
        attendance.setStatus(isLate(checkInAt) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT);

        return toResponse(attendanceRepository.save(attendance));
    }

    /*
     * ============================================================
     * MANUAL CHECK-OUT
     *
     * Kept for HR/Manager functionality.
     * ============================================================
     */
    public AttendanceResponse checkOut(Long employeeId) {

        Attendance attendance = attendanceRepository
                .findByEmployee_IdAndWorkDate(employeeId, LocalDate.now())
                .orElseThrow(() -> new ConflictException("Check-in not found for today"));

        if (attendance.getCheckInAt() == null) {
            throw new ConflictException("Checkout before check-in is not allowed");
        }

        if (attendance.getCheckOutAt() != null) {
            throw new ConflictException("Employee already checked out today");
        }

        LocalDateTime checkout = LocalDateTime.now();

        if (checkout.isBefore(attendance.getCheckInAt())) {
            throw new ConflictException("Checkout cannot be before check-in");
        }

        long workedMinutes = Duration
                .between(attendance.getCheckInAt(), checkout)
                .toMinutes();

        attendance.setCheckOutAt(checkout);
        attendance.setWorkedMinutes(workedMinutes);

        if (workedMinutes < 240) {
            attendance.setStatus(AttendanceStatus.HALF_DAY);
        } else if (attendance.getStatus() != AttendanceStatus.LATE) {
            attendance.setStatus(AttendanceStatus.PRESENT);
        }

        return toResponse(attendanceRepository.save(attendance));
    }

    /*
     * ============================================================
     * EMPLOYEE HISTORY
     * ============================================================
     */
    @Transactional(readOnly = true)
    public List<AttendanceResponse> history(Long employeeId, int page, int size) {

        return attendanceRepository
                .findByEmployee_IdOrderByWorkDateDesc(employeeId, PageRequest.of(page, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /*
     * ============================================================
     * MONTHLY SUMMARY
     * ============================================================
     */
    @Transactional(readOnly = true)
    public AttendanceSummaryResponse monthlySummary(Long employeeId) {

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        List<Attendance> records = attendanceRepository
                .findByEmployee_IdOrderByWorkDateDesc(employeeId, PageRequest.of(0, 1000))
                .getContent();

        long present = records.stream()
                .filter(record -> !record.getWorkDate().isBefore(monthStart) 
                        && record.getStatus() == AttendanceStatus.PRESENT)
                .count();

        long late = records.stream()
                .filter(record -> !record.getWorkDate().isBefore(monthStart) 
                        && record.getStatus() == AttendanceStatus.LATE)
                .count();

        long halfDay = records.stream()
                .filter(record -> !record.getWorkDate().isBefore(monthStart) 
                        && record.getStatus() == AttendanceStatus.HALF_DAY)
                .count();

        long absent = records.stream()
                .filter(record -> !record.getWorkDate().isBefore(monthStart) 
                        && record.getStatus() == AttendanceStatus.ABSENT)
                .count();

        long onLeave = records.stream()
                .filter(record -> !record.getWorkDate().isBefore(monthStart) 
                        && record.getStatus() == AttendanceStatus.ON_LEAVE)
                .count();

        return new AttendanceSummaryResponse(present, late, halfDay, absent, onLeave);
    }

    /*
     * ============================================================
     * EMPLOYEE OWN HISTORY
     * ============================================================
     */
    @Transactional(readOnly = true)
    public List<AttendanceResponse> myHistory(String email, int page, int size) {

        Employee employee = employeeRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Employee profile not found"));

        return history(employee.getId(), page, size);
    }

    /*
     * ============================================================
     * MANAGER TEAM ATTENDANCE
     *
     * Manager sees:
     *
     * 1. Own attendance
     * 2. Direct team's attendance
     * ============================================================
     */
    @Transactional(readOnly = true)
    public List<AttendanceResponse> teamAttendance(String email) {

        Employee manager = employeeRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Employee profile not found"));

        List<Employee> team = employeeRepository
                .findByManager_IdAndDeletedFalse(manager.getId());

        List<Long> employeeIds = new ArrayList<>();

        /*
         * Manager's own attendance.
         */
        employeeIds.add(manager.getId());

        /*
         * Direct reports.
         */
        employeeIds.addAll(team.stream().map(Employee::getId).toList());

        return attendanceRepository
                .findByEmployee_IdInAndWorkDate(employeeIds, LocalDate.now())
                .stream()
                .map(this::toResponse)
                .sorted(Comparator
                        .comparing((AttendanceResponse a) -> !a.employeeId().equals(manager.getId()))
                        .thenComparing(AttendanceResponse::employeeName))
                .toList();
    }

    /*
     * ============================================================
     * HR TODAY
     *
     * HR sees attendance of all active employees.
     *
     * If an employee has not logged in today,
     * they appear as ABSENT.
     * ============================================================
     */
    @Transactional(readOnly = true)
    public List<AttendanceResponse> allTodayAttendance() {

        LocalDate today = LocalDate.now();

        List<Employee> employees = employeeRepository
                .findAll()
                .stream()
                .filter(employee -> employee.isActive() 
                        && !employee.isDeleted() 
                        && employee.getEmploymentStatus() != EmploymentStatus.TERMINATED)
                .toList();

        return employees.stream()
                .map(employee -> attendanceRepository
                        .findByEmployee_IdAndWorkDate(employee.getId(), today)
                        .map(this::toResponse)
                        .orElseGet(() -> new AttendanceResponse(
                                null,
                                employee.getId(),
                                employee.getFirstName() + " " + employee.getLastName(),
                                today,
                                null,
                                null,
                                AttendanceStatus.ABSENT,
                                null
                        )))
                .toList();
    }

    /*
     * ============================================================
     * CHECK-IN TIME / WORKED TIME SUPPORT
     *
     * Used if you later want the backend to return
     * live working information.
     *
     * Current frontend can calculate live elapsed time
     * from checkInAt.
     * ============================================================
     */
    @Transactional(readOnly = true)
    public AttendanceResponse todayAttendance(String email) {

        Employee employee = employeeRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Employee profile not found"));

        return attendanceRepository
                .findByEmployee_IdAndWorkDate(employee.getId(), LocalDate.now())
                .map(this::toResponse)
                .orElse(null);
    }

    /*
     * ============================================================
     * CHECK-OUT IF EMPLOYEE IS CURRENTLY CHECKED IN
     * Used automatically during logout.
     *
     * Important:
     * - Does not throw if no attendance exists.
     * - Does not throw if already checked out.
     * - Calculates worked minutes.
     * ============================================================
     */
    public AttendanceResponse checkOutIfCheckedIn(Long employeeId) {

        Attendance attendance = attendanceRepository
                .findByEmployee_IdAndWorkDate(employeeId, LocalDate.now())
                .orElse(null);

        /*
         * No attendance for today.
         * Logout should still succeed.
         */
        if (attendance == null) {
            return null;
        }

        /*
         * Employee has not checked in.
         * Nothing to check out.
         */
        if (attendance.getCheckInAt() == null) {
            return null;
        }

        /*
         * Already checked out.
         */
        if (attendance.getCheckOutAt() != null) {
            return toResponse(attendance);
        }

        LocalDateTime checkOutAt = LocalDateTime.now();

        if (checkOutAt.isBefore(attendance.getCheckInAt())) {
            throw new ConflictException("Checkout cannot be before check-in");
        }

        long workedMinutes = Duration
                .between(attendance.getCheckInAt(), checkOutAt)
                .toMinutes();

        attendance.setCheckOutAt(checkOutAt);
        attendance.setWorkedMinutes(workedMinutes);

        /*
         * Keep LATE if the employee checked in late.
         *
         * Otherwise:
         * < 4 hours  -> HALF_DAY
         * >= 4 hours -> PRESENT
         */
        if (workedMinutes < 240) {
            attendance.setStatus(AttendanceStatus.HALF_DAY);
        } else if (attendance.getStatus() != AttendanceStatus.LATE) {
            attendance.setStatus(AttendanceStatus.PRESENT);
        }

        return toResponse(attendanceRepository.save(attendance));
    }

    /*
     * ============================================================
     * LATE CHECK
     * ============================================================
     */
    private boolean isLate(LocalDateTime checkInAt) {
        return checkInAt.toLocalTime().isAfter(LocalTime.of(9, 30));
    }

    /*
     * ============================================================
     * FIND EMPLOYEE BY ID
     * ============================================================
     */
    private Employee findActiveEmployee(Long employeeId) {

        Employee employee = employeeRepository
                .findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        validateEmployee(employee);

        return employee;
    }

    /*
     * ============================================================
     * FIND EMPLOYEE BY LOGIN EMAIL
     * ============================================================
     */
    private Employee findActiveEmployeeByEmail(String email) {

        Employee employee = employeeRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Employee profile not found"));

        validateEmployee(employee);

        return employee;
    }

    /*
     * ============================================================
     * EMPLOYEE VALIDATION
     * ============================================================
     */
    private void validateEmployee(Employee employee) {

        if (!employee.isActive() || employee.isDeleted() 
                || employee.getEmploymentStatus() == EmploymentStatus.TERMINATED) {

            throw new ConflictException("Employee is inactive");
        }
    }

    /*
     * ============================================================
     * ENTITY -> DTO
     * ============================================================
     */
    private AttendanceResponse toResponse(Attendance attendance) {

        return new AttendanceResponse(
                attendance.getId(),
                attendance.getEmployee().getId(),
                attendance.getEmployee().getFirstName() + " " + attendance.getEmployee().getLastName(),
                attendance.getWorkDate(),
                attendance.getCheckInAt(),
                attendance.getCheckOutAt(),
                attendance.getStatus(),
                attendance.getWorkedMinutes()
        );
    }

    /*
 * ============================================================
 * SELF CHECK-IN (manual, single per day)
 *
 * Used by the employee's own Check In button.
 * Unlike checkInForLogin(), this does NOT allow a second
 * session on the same day — it throws if already checked in.
 * ============================================================
 */
public AttendanceResponse checkInSelf(String email) {

    Employee employee = findActiveEmployeeByEmail(email);

    LocalDate today = LocalDate.now();

    Attendance attendance = attendanceRepository
            .findByEmployee_IdAndWorkDate(employee.getId(), today)
            .orElse(null);

    if (attendance != null && attendance.getCheckInAt() != null) {
        throw new ConflictException("You have already checked in today");
    }

    if (attendance == null) {
        attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setWorkDate(today);
    }

    LocalDateTime checkInAt = LocalDateTime.now();

    attendance.setCheckInAt(checkInAt);
    attendance.setCheckOutAt(null);
    attendance.setWorkedMinutes(null);
    attendance.setStatus(isLate(checkInAt) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT);

    return toResponse(attendanceRepository.save(attendance));
}

/*
 * ============================================================
 * SELF CHECK-OUT (manual, single per day)
 * ============================================================
 */
public AttendanceResponse checkOutSelf(String email) {

    Employee employee = findActiveEmployeeByEmail(email);

    Attendance attendance = attendanceRepository
            .findByEmployee_IdAndWorkDate(employee.getId(), LocalDate.now())
            .orElseThrow(() -> new ConflictException("You have not checked in today"));

    if (attendance.getCheckInAt() == null) {
        throw new ConflictException("You have not checked in today");
    }

    if (attendance.getCheckOutAt() != null) {
        throw new ConflictException("You have already checked out today");
    }

    LocalDateTime checkOutAt = LocalDateTime.now();

    if (checkOutAt.isBefore(attendance.getCheckInAt())) {
        throw new ConflictException("Checkout cannot be before check-in");
    }

    long workedMinutes = Duration
            .between(attendance.getCheckInAt(), checkOutAt)
            .toMinutes();

    attendance.setCheckOutAt(checkOutAt);
    attendance.setWorkedMinutes(workedMinutes);

    if (workedMinutes < 240) {
        if (attendance.getStatus() != AttendanceStatus.LATE) {
            attendance.setStatus(AttendanceStatus.HALF_DAY);
        }
    } else if (attendance.getStatus() != AttendanceStatus.LATE) {
        attendance.setStatus(AttendanceStatus.PRESENT);
    }

    return toResponse(attendanceRepository.save(attendance));
}
}