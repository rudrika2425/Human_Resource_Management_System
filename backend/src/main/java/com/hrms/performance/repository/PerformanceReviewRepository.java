package com.hrms.performance.repository;

import com.hrms.employee.entity.Employee;
import com.hrms.performance.entity.PerformanceReview;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PerformanceReviewRepository
        extends JpaRepository<PerformanceReview, Long> {

    List<PerformanceReview> findByEmployee(Employee employee);

    List<PerformanceReview> findByManager(Employee manager);

    List<PerformanceReview> findByEmployeeId(Long employeeId);
    
    List<PerformanceReview> findByManagerId(Long managerId);
}