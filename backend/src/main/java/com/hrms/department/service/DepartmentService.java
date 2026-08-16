package com.hrms.department.service;

import com.hrms.common.exception.ConflictException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.department.dto.DepartmentRequest;
import com.hrms.department.dto.DepartmentResponse;
import com.hrms.department.entity.Department;
import com.hrms.department.repository.DepartmentRepository;
import com.hrms.employee.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    
    public DepartmentService(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("Department already exists");
        }
        
        Department department = new Department();
        department.setName(request.name());
        department.setDescription(request.description());
        department.setActive(request.active() == null || request.active());
        
        if (request.managerId() != null) {
            department.setManager(employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new NotFoundException("Manager employee not found")));
        }
        
        return toResponse(departmentRepository.save(department));
    }

    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department department = find(id);
        
        if (!department.getName().equalsIgnoreCase(request.name()) && 
            departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("Department already exists");
        }
        
        department.setName(request.name());
        department.setDescription(request.description());
        department.setActive(request.active() == null || request.active());
        
        if (request.managerId() != null) {
            department.setManager(employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new NotFoundException("Manager employee not found")));
        } else {
            department.setManager(null);
        }
        
        return toResponse(departmentRepository.save(department));
    }

    @Transactional(readOnly = true)
    public DepartmentResponse get(Long id) {
        return toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> list() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DepartmentResponse delete(Long id) {
        Department department = find(id);
        long count = employeeRepository.countByDepartment_Id(id);
        if (count > 0) {
            throw new ConflictException("Department cannot be deleted while employees are assigned");
        }
        departmentRepository.delete(department);
        return toResponse(department);
    }

    private Department find(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Department not found"));
    }

    private DepartmentResponse toResponse(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getDescription(),
                department.getManager() == null ? null : department.getManager().getId(),
                department.getManager() == null ? null : 
                        department.getManager().getFirstName() + " " + department.getManager().getLastName(),
                department.isActive(),
                employeeRepository.countByDepartment_Id(department.getId()),
                department.getCreatedAt(),
                department.getUpdatedAt()
        );
    }
}