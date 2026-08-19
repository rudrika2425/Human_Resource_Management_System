package com.hrms.employee.repository;

import com.hrms.employee.entity.Employee;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EmployeeRepository
        extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    boolean existsByEmployeeIdIgnoreCase(String employeeId);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Employee> findByEmployeeIdIgnoreCase(String employeeId);

    Optional<Employee> findByEmailIgnoreCase(String email);

    long countByDepartment_Id(Long departmentId);

    long countByDesignation_Id(Long designationId);

    List<Employee> findByManager_IdAndDeletedFalse(Long managerId);
    Optional<Employee> findByUserId(Long userId);

    Optional<Employee> findByEmployeeId(String employeeId);

    Optional<Employee> findByUser_Id(Long userId);

    List<Employee> findByManager_Id(Long managerId);

    Optional<Employee> findByEmail(String email);
}