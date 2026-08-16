package com.hrms.payroll;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.payroll.dto.PayrollGenerateRequest;
import com.hrms.payroll.entity.Payroll;
import com.hrms.payroll.entity.SalaryStructure;
import com.hrms.payroll.repository.PayrollRepository;
import com.hrms.payroll.repository.SalaryStructureRepository;
import com.hrms.payroll.service.ContractPayrollStrategy;
import com.hrms.payroll.service.PayrollService;
import com.hrms.payroll.service.PayrollStrategyFactory;
import com.hrms.payroll.service.StandardPayrollStrategy;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock private SalaryStructureRepository salaryStructureRepository;
    @Mock private PayrollRepository payrollRepository;
    @Mock private EmployeeRepository employeeRepository;

    private PayrollService payrollService;

    @BeforeEach
    void setUp() {
        payrollService = new PayrollService(salaryStructureRepository, payrollRepository, employeeRepository,
                new PayrollStrategyFactory(List.of(new StandardPayrollStrategy(), new ContractPayrollStrategy())));
    }

    @Test
    void generateUsesContractStrategy() {
        Employee employee = Employee.builder().firstName("A").lastName("B").active(true).deleted(false).employmentStatus(EmploymentStatus.ACTIVE).employmentType(EmploymentType.CONTRACT).build();
        employee.setId(1L);
        SalaryStructure structure = SalaryStructure.builder().employee(employee).basicSalary(1000.0).allowances(200.0).deductions(100.0).bonuses(50.0).build();
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(salaryStructureRepository.findByEmployee_Id(1L)).thenReturn(Optional.of(structure));
        when(payrollRepository.existsByEmployee_IdAndPayrollMonth(1L, "2026-08")).thenReturn(false);
        when(payrollRepository.save(org.mockito.ArgumentMatchers.any(Payroll.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = payrollService.generate(new PayrollGenerateRequest(1L, "2026-08"));

        assertThat(response.netSalary()).isEqualTo(950.0);
        assertThat(response.strategyName()).isEqualTo("CONTRACT");
    }
}
