package com.hrms.designation.service;

import com.hrms.common.exception.ConflictException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.department.repository.DepartmentRepository;
import com.hrms.designation.dto.DesignationRequest;
import com.hrms.designation.dto.DesignationResponse;
import com.hrms.designation.entity.Designation;
import com.hrms.designation.repository.DesignationRepository;
import com.hrms.employee.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DesignationService {

    private final DesignationRepository designationRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    
    public DesignationService(
            DesignationRepository designationRepository,
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository) {
        this.designationRepository = designationRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    public DesignationResponse create(DesignationRequest request) {
        if (designationRepository.existsByNameIgnoreCaseAndDepartment_Id(request.name(), request.departmentId())) {
            throw new ConflictException("Designation already exists for this department");
        }
        
        Designation designation = new Designation();
        designation.setName(request.name());
        designation.setDepartment(departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new NotFoundException("Department not found")));
        designation.setDescription(request.description());
        designation.setLevel(request.level());
        designation.setActive(request.active() == null || request.active());
        
        return toResponse(designationRepository.save(designation));
    }

    public DesignationResponse update(Long id, DesignationRequest request) {
        Designation designation = find(id);
        
        if (!designation.getName().equalsIgnoreCase(request.name()) && 
            designationRepository.existsByNameIgnoreCaseAndDepartment_Id(request.name(), request.departmentId())) {
            throw new ConflictException("Designation already exists for this department");
        }
        
        designation.setName(request.name());
        designation.setDepartment(departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new NotFoundException("Department not found")));
        designation.setDescription(request.description());
        designation.setLevel(request.level());
        designation.setActive(request.active() == null || request.active());
        
        return toResponse(designationRepository.save(designation));
    }

    @Transactional(readOnly = true)
    public DesignationResponse get(Long id) {
        return toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public List<DesignationResponse> list() {
        return designationRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DesignationResponse delete(Long id) {
        Designation designation = find(id);
        long employeeCount = employeeRepository.countByDesignation_Id(id);
        
        if (employeeCount > 0) {
            throw new ConflictException("Designation cannot be deleted while employees are assigned");
        }
        
        designationRepository.delete(designation);
        return toResponse(designation);
    }

    private Designation find(Long id) {
        return designationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Designation not found"));
    }

    private DesignationResponse toResponse(Designation designation) {
        return new DesignationResponse(
                designation.getId(),
                designation.getName(),
                designation.getDepartment().getId(),
                designation.getDepartment().getName(),
                designation.getDescription(),
                designation.getLevel(),
                designation.isActive(),
                employeeRepository.countByDesignation_Id(designation.getId()),
                designation.getCreatedAt(),
                designation.getUpdatedAt()
        );
    }
}