package com.hrms.designation.repository;

import com.hrms.designation.entity.Designation;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hrms.department.entity.Department;
public interface DesignationRepository extends JpaRepository<Designation, Long> {
    boolean existsByNameIgnoreCaseAndDepartment_Id(String name, Long departmentId);
    Optional<Designation> findByNameIgnoreCaseAndDepartment_Id(String name, Long departmentId);
    Optional<Designation> findByNameAndDepartment(
        String name,
        Department department
);
}
