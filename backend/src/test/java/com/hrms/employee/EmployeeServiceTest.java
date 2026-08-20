package com.hrms.employee;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.hrms.auth.entity.UserRole;
import com.hrms.common.exception.ConflictException;
import com.hrms.department.repository.DepartmentRepository;
import com.hrms.designation.repository.DesignationRepository;
import com.hrms.employee.dto.EmployeeRequest;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.employee.service.EmployeeService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private DesignationRepository designationRepository;

   
    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeService(
                employeeRepository,
                departmentRepository,
                designationRepository
        );
    }

    @Test
    void createRejectsDuplicateEmail() {

        Employee existing = Employee.builder()
                .email("dup@hrms.local")
                .build();

        existing.setId(2L);

        when(employeeRepository.findByEmailIgnoreCase("dup@hrms.local"))
                .thenReturn(Optional.of(existing));

        when(employeeRepository.findByEmployeeIdIgnoreCase("E-100"))
                .thenReturn(Optional.empty());

        EmployeeRequest request = new EmployeeRequest(
                "E-100",                       // employeeId
                "John",                        // firstName
                "Doe",                        // lastName
                "dup@hrms.local",              // email
                null,                          // phone
                null,                          // profileImageUrl
                null,                          // dateOfBirth
                null,                          // address
                null,                          // emergencyContact
                null,                          // joiningDate
                null,                          // departmentId
                null,                          // designationId
                null,                          // managerId
                EmploymentType.FULL_TIME,
                EmploymentStatus.ACTIVE,
                null,                          // workLocation
                null,                          // skills
                null,                          // education
                null,                          // experience
                true,                          // active
                UserRole.EMPLOYEE              // assignedRole
        );

        assertThatThrownBy(() -> employeeService.create(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Employee email already exists");
    }
}
