package com.hrms.performance.repository;

import com.hrms.employee.entity.Employee;
import com.hrms.performance.entity.Goal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    boolean existsByTitleAndEmployee(
            String title,
            Employee employee
    );

    List<Goal> findByEmployee(Employee employee);

    List<Goal> findByManager(Employee manager);

    List<Goal> findByEmployeeId(Long employeeId);
    
    List<Goal> findByManagerId(Long managerId);
}