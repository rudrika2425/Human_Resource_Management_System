package com.hrms.payroll.repository;

import com.hrms.payroll.entity.Payroll;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    boolean existsByEmployee_IdAndPayrollMonth(Long employeeId, String payrollMonth);
    Optional<Payroll> findByEmployee_IdAndPayrollMonth(Long employeeId, String payrollMonth);
    List<Payroll> findByEmployee_IdOrderByPayrollMonthDesc(Long employeeId);
}
