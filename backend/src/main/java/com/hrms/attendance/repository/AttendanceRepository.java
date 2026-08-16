package com.hrms.attendance.repository;
import com.hrms.employee.entity.Employee;
import com.hrms.attendance.entity.Attendance;
import com.hrms.attendance.entity.AttendanceStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployee_IdAndWorkDate(Long employeeId, LocalDate workDate);
    Page<Attendance> findByEmployee_IdOrderByWorkDateDesc(Long employeeId, Pageable pageable);
    List<Attendance> findByWorkDateAndStatus(LocalDate workDate, AttendanceStatus status);
    long countByWorkDateAndStatus(LocalDate workDate, AttendanceStatus status);
    List<Attendance> findByEmployee_IdInAndWorkDateOrderByEmployee_FirstNameAsc(
        List<Long> employeeIds,
        LocalDate workDate
    );
    List<Attendance> findByWorkDate(LocalDate workDate);
    List<Attendance> findByEmployee_IdInAndWorkDate(
        List<Long> employeeIds,
        LocalDate workDate
);
boolean existsByEmployeeAndWorkDate(
        Employee employee,
        LocalDate workDate
);
}
