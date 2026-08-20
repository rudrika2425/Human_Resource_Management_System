package com.hrms.employee.service;

import com.hrms.auth.entity.UserRole;
import com.hrms.auth.repository.UserRepository;
import com.hrms.common.exception.ConflictException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.common.response.PageResponse;
import com.hrms.common.security.UserPrincipal;
import com.hrms.department.repository.DepartmentRepository;
import com.hrms.designation.repository.DesignationRepository;
import com.hrms.employee.dto.EmployeePatchRequest;
import com.hrms.employee.dto.EmployeeRequest;
import com.hrms.employee.dto.EmployeeResponse;
import com.hrms.employee.dto.ManagerResponse;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final UserRepository userRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            DesignationRepository designationRepository,
            UserRepository userRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.userRepository = userRepository;
    }

    public EmployeeResponse create(EmployeeRequest request) {
        validateDuplicates(request.employeeId(), request.email(), null);

        Employee employee = new Employee();

        apply(employee, request);

        employee.setDeleted(false);
        employee.setActive(request.active() == null || request.active());

        employee.setAssignedRole(
                request.assignedRole() == null
                        ? UserRole.EMPLOYEE
                        : request.assignedRole()
        );

        return toResponse(employeeRepository.save(employee));
    }

    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = findEmployee(id);

        validateDuplicates(
                request.employeeId(),
                request.email(),
                id
        );

        apply(employee, request);

        syncUserRole(employee);

        return toResponse(employeeRepository.save(employee));
    }

    public EmployeeResponse patch(Long id, EmployeePatchRequest request) {
        Employee employee = findEmployee(id);

        if (request.firstName() != null) {
            employee.setFirstName(request.firstName());
        }

        if (request.lastName() != null) {
            employee.setLastName(request.lastName());
        }

        if (request.phone() != null) {
            employee.setPhone(request.phone());
        }

        if (request.profileImageUrl() != null) {
            employee.setProfileImageUrl(request.profileImageUrl());
        }

        if (request.dateOfBirth() != null) {
            employee.setDateOfBirth(request.dateOfBirth());
        }

        if (request.address() != null) {
            employee.setAddress(request.address());
        }

        if (request.emergencyContact() != null) {
            employee.setEmergencyContact(request.emergencyContact());
        }

        if (request.joiningDate() != null) {
            employee.setJoiningDate(request.joiningDate());
        }

        if (request.departmentId() != null) {
            employee.setDepartment(
                    departmentRepository.findById(request.departmentId())
                            .orElseThrow(() ->
                                    new NotFoundException("Department not found")
                            )
            );
        }

        if (request.designationId() != null) {
            employee.setDesignation(
                    designationRepository.findById(request.designationId())
                            .orElseThrow(() ->
                                    new NotFoundException("Designation not found")
                            )
            );
        }

        if (request.managerId() != null) {
            employee.setManager(
                    findEmployee(request.managerId())
            );
        }

        if (request.employmentType() != null) {
            employee.setEmploymentType(request.employmentType());
        }

        if (request.employmentStatus() != null) {
            employee.setEmploymentStatus(request.employmentStatus());
        }

        if (request.workLocation() != null) {
            employee.setWorkLocation(request.workLocation());
        }

        if (request.skills() != null) {
            employee.setSkills(request.skills());
        }

        if (request.education() != null) {
            employee.setEducation(request.education());
        }

        if (request.experience() != null) {
            employee.setExperience(request.experience());
        }

        if (request.active() != null) {
            employee.setActive(request.active());
        }

        if (request.assignedRole() != null) {
            employee.setAssignedRole(request.assignedRole());
            syncUserRole(employee);
        }

        return toResponse(employeeRepository.save(employee));
    }

    private void syncUserRole(Employee employee) {
        if (employee.getAssignedRole() == null) {
            return;
        }

        if (employee.getUser() == null) {
            return;
        }

        employee.getUser().setRoles(
                Set.of(employee.getAssignedRole())
        );

        userRepository.save(employee.getUser());
    }

    @Transactional(readOnly = true)
    public EmployeeResponse get(Long id) {
        return toResponse(findEmployee(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> search(
            String keyword,
            Long departmentId,
            Long designationId,
            Long managerId,
            EmploymentStatus employmentStatus,
            String workLocation,
            String employmentType,
            Boolean active,
            LocalDate joiningFrom,
            LocalDate joiningTo,
            int page,
            int size,
            String sortBy,
            String direction) {

        Specification<Employee> specification =
                Specification.where(notDeleted());

        if (StringUtils.hasText(keyword)) {
            String like = "%" + keyword.toLowerCase() + "%";

            specification = specification.and(
                    (root, query, cb) -> cb.or(
                            cb.like(
                                    cb.lower(root.get("employeeId")),
                                    like
                            ),
                            cb.like(
                                    cb.lower(root.get("firstName")),
                                    like
                            ),
                            cb.like(
                                    cb.lower(root.get("lastName")),
                                    like
                            ),
                            cb.like(
                                    cb.lower(root.get("email")),
                                    like
                            ),
                            cb.like(
                                    cb.lower(root.get("phone")),
                                    like
                            ),
                            cb.like(
                                    cb.lower(root.get("skills")),
                                    like
                            ),
                            cb.like(
                                    cb.lower(root.get("workLocation")),
                                    like
                            )
                    )
            );
        }

        if (departmentId != null) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    root.get("department").get("id"),
                                    departmentId
                            )
            );
        }

        if (designationId != null) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    root.get("designation").get("id"),
                                    designationId
                            )
            );
        }

        if (managerId != null) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    root.get("manager").get("id"),
                                    managerId
                            )
            );
        }

        if (employmentStatus != null) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    root.get("employmentStatus"),
                                    employmentStatus
                            )
            );
        }

        if (StringUtils.hasText(workLocation)) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    cb.lower(root.get("workLocation")),
                                    workLocation.toLowerCase()
                            )
            );
        }

        if (StringUtils.hasText(employmentType)) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    root.get("employmentType").as(String.class),
                                    employmentType
                            )
            );
        }

        if (active != null) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.equal(
                                    root.get("active"),
                                    active
                            )
            );
        }

        if (joiningFrom != null) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.greaterThanOrEqualTo(
                                    root.get("joiningDate"),
                                    joiningFrom
                            )
            );
        }

        if (joiningTo != null) {
            specification = specification.and(
                    (root, query, cb) ->
                            cb.lessThanOrEqualTo(
                                    root.get("joiningDate"),
                                    joiningTo
                            )
            );
        }

        Sort sort = Sort.by(
                Sort.Direction.fromString(
                        direction == null ? "ASC" : direction
                ),
                StringUtils.hasText(sortBy)
                        ? sortBy
                        : "createdAt"
        );

        Page<Employee> result =
                employeeRepository.findAll(
                        specification,
                        PageRequest.of(page, size, sort)
                );

        List<EmployeeResponse> responses =
                result.getContent()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return PageResponse.of(
                "Employees fetched",
                responses,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    public EmployeeResponse activate(Long id) {
        Employee employee = findEmployee(id);

        employee.setActive(true);
        employee.setEmploymentStatus(
                EmploymentStatus.ACTIVE
        );

        return toResponse(
                employeeRepository.save(employee)
        );
    }

    public EmployeeResponse deactivate(Long id) {
        Employee employee = findEmployee(id);

        employee.setActive(false);
        employee.setEmploymentStatus(
                EmploymentStatus.INACTIVE
        );

        return toResponse(
                employeeRepository.save(employee)
        );
    }

    public EmployeeResponse delete(Long id) {
        Employee employee = findEmployee(id);

        employee.setDeleted(true);
        employee.setActive(false);
        employee.setEmploymentStatus(
                EmploymentStatus.TERMINATED
        );

        return toResponse(
                employeeRepository.save(employee)
        );
    }

    public List<EmployeeResponse> myTeam(
            UserPrincipal principal) {

        Employee manager =
                employeeRepository
                        .findByUser_Id(principal.getId())
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Manager employee profile not found"
                                )
                        );

        return employeeRepository
                .findByManager_IdAndDeletedFalse(
                        manager.getId()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateDuplicates(
            String employeeId,
            String email,
            Long currentId) {

        employeeRepository
                .findByEmployeeIdIgnoreCase(employeeId)
                .filter(existing ->
                        !Objects.equals(
                                existing.getId(),
                                currentId
                        )
                )
                .ifPresent(existing -> {
                    throw new ConflictException(
                            "Employee ID already exists"
                    );
                });

        employeeRepository
                .findByEmailIgnoreCase(email)
                .filter(existing ->
                        !Objects.equals(
                                existing.getId(),
                                currentId
                        )
                )
                .ifPresent(existing -> {
                    throw new ConflictException(
                            "Employee email already exists"
                    );
                });
    }

    private void apply(
            Employee employee,
            EmployeeRequest request) {

        employee.setEmployeeId(request.employeeId());
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email().toLowerCase());
        employee.setPhone(request.phone());
        employee.setProfileImageUrl(request.profileImageUrl());
        employee.setDateOfBirth(request.dateOfBirth());
        employee.setAddress(request.address());
        employee.setEmergencyContact(request.emergencyContact());
        employee.setJoiningDate(request.joiningDate());

        employee.setAssignedRole(
                request.assignedRole() == null
                        ? UserRole.EMPLOYEE
                        : request.assignedRole()
        );

        employee.setDepartment(
                request.departmentId() == null
                        ? null
                        : departmentRepository
                                .findById(request.departmentId())
                                .orElseThrow(() ->
                                        new NotFoundException(
                                                "Department not found"
                                        )
                                )
        );

        employee.setDesignation(
                request.designationId() == null
                        ? null
                        : designationRepository
                                .findById(request.designationId())
                                .orElseThrow(() ->
                                        new NotFoundException(
                                                "Designation not found"
                                        )
                                )
        );

        employee.setManager(
                request.managerId() == null
                        ? null
                        : findEmployee(request.managerId())
        );

        if (request.managerId() != null &&
                request.managerId().equals(employee.getId())) {

            throw new ConflictException(
                    "Employee cannot be their own manager"
            );
        }

        employee.setEmploymentType(
                request.employmentType()
        );

        employee.setEmploymentStatus(
                request.employmentStatus()
        );

        employee.setWorkLocation(
                request.workLocation()
        );

        employee.setSkills(
                request.skills()
        );

        employee.setEducation(
                request.education()
        );

        employee.setExperience(
                request.experience()
        );
    }

    private Employee findEmployee(Long id) {
        return employeeRepository
                .findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Employee not found"
                        )
                );
    }

    private Specification<Employee> notDeleted() {
        return (root, query, cb) ->
                cb.isFalse(root.get("deleted"));
    }

    private EmployeeResponse toResponse(
            Employee employee) {

        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getPhone(),
                employee.getProfileImageUrl(),
                employee.getDateOfBirth(),
                employee.getAddress(),
                employee.getEmergencyContact(),
                employee.getJoiningDate(),

                employee.getDepartment() == null
                        ? null
                        : employee.getDepartment().getId(),

                employee.getDepartment() == null
                        ? null
                        : employee.getDepartment().getName(),

                employee.getDesignation() == null
                        ? null
                        : employee.getDesignation().getId(),

                employee.getDesignation() == null
                        ? null
                        : employee.getDesignation().getName(),

                employee.getManager() == null
                        ? null
                        : employee.getManager().getId(),

                employee.getManager() == null
                        ? null
                        : employee.getManager().getFirstName()
                        + " "
                        + employee.getManager().getLastName(),

                employee.getAssignedRole(),

                employee.getEmploymentType(),
                employee.getEmploymentStatus(),
                employee.getWorkLocation(),
                employee.getSkills(),
                employee.getEducation(),
                employee.getExperience(),
                employee.isActive(),
                employee.isDeleted(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public ManagerResponse getManager(Long employeeId) {

        Employee employee =
                employeeRepository
                        .findById(employeeId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Employee not found"
                                )
                        );

        Employee manager = employee.getManager();

        if (manager == null) {
            return null;
        }

        return new ManagerResponse(
                manager.getId(),
                manager.getFirstName()
                        + " "
                        + manager.getLastName()
        );
    }
}