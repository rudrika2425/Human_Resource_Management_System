package com.hrms.payroll.repository;

import com.hrms.payroll.entity.SalaryStructure;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hrms.employee.entity.Employee;
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {
    Optional<SalaryStructure> findByEmployee_Id(Long employeeId);
    boolean existsByEmployee(Employee employee);
    
}
