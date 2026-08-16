package com.hrms.payroll.service;

import com.hrms.common.exception.ConflictException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.payroll.dto.PayrollGenerateRequest;
import com.hrms.payroll.dto.PayrollResponse;
import com.hrms.payroll.dto.SalaryStructureRequest;
import com.hrms.payroll.dto.SalaryStructureResponse;
import com.hrms.payroll.entity.Payroll;
import com.hrms.payroll.entity.SalaryStructure;
import com.hrms.payroll.repository.PayrollRepository;
import com.hrms.payroll.repository.SalaryStructureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PayrollService {

    private final SalaryStructureRepository salaryStructureRepository;
    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final PayrollStrategyFactory payrollStrategyFactory;

    
    public PayrollService(
            SalaryStructureRepository salaryStructureRepository,
            PayrollRepository payrollRepository,
            EmployeeRepository employeeRepository,
            PayrollStrategyFactory payrollStrategyFactory) {
        this.salaryStructureRepository = salaryStructureRepository;
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
        this.payrollStrategyFactory = payrollStrategyFactory;
    }

    public SalaryStructureResponse upsertSalaryStructure(SalaryStructureRequest request) {
        Employee employee = findActiveEmployee(request.employeeId());
        
        SalaryStructure structure = salaryStructureRepository.findByEmployee_Id(employee.getId())
                .orElseGet(() -> {
                    SalaryStructure newStructure = new SalaryStructure();
                    newStructure.setEmployee(employee);
                    return newStructure;
                });
        
        structure.setBasicSalary(request.basicSalary());
        structure.setAllowances(request.allowances());
        structure.setDeductions(request.deductions());
        structure.setBonuses(request.bonuses());
        
        return toResponse(salaryStructureRepository.save(structure));
    }

    public PayrollResponse generate(PayrollGenerateRequest request) {
        Employee employee = findActiveEmployee(request.employeeId());
        
        if (payrollRepository.existsByEmployee_IdAndPayrollMonth(employee.getId(), request.payrollMonth())) {
            throw new ConflictException("Payroll already generated for this month");
        }
        
        SalaryStructure structure = salaryStructureRepository.findByEmployee_Id(employee.getId())
                .orElseThrow(() -> new NotFoundException("Salary structure not found"));
        
        PayrollCalculationStrategy strategy = payrollStrategyFactory.getStrategy(employee.getEmploymentType());
        PayrollCalculationResult result = strategy.calculate(
                structure.getBasicSalary(), 
                structure.getAllowances(), 
                structure.getDeductions(), 
                structure.getBonuses());
        
        Payroll payroll = new Payroll();
        payroll.setEmployee(employee);
        payroll.setPayrollMonth(request.payrollMonth());
        payroll.setBasicSalary(structure.getBasicSalary());
        payroll.setAllowances(structure.getAllowances());
        payroll.setDeductions(structure.getDeductions());
        payroll.setBonuses(structure.getBonuses());
        payroll.setGrossSalary(result.grossSalary());
        payroll.setNetSalary(result.netSalary());
        payroll.setStrategyName(strategy.name());
        
        return toResponse(payrollRepository.save(payroll));
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> history(Long employeeId) {
        return payrollRepository.findByEmployee_IdOrderByPayrollMonthDesc(employeeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SalaryStructureResponse getStructure(Long employeeId) {
        return salaryStructureRepository.findByEmployee_Id(employeeId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Salary structure not found"));
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> historyByUser(String email) {
        Employee employee = employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Employee profile not found"));

        return payrollRepository
                .findByEmployee_IdOrderByPayrollMonthDesc(employee.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Employee findActiveEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        
        if (!employee.isActive() || employee.isDeleted() || 
            employee.getEmploymentStatus() == EmploymentStatus.TERMINATED) {
            throw new ConflictException("Employee is inactive");
        }
        return employee;
    }

    private SalaryStructureResponse toResponse(SalaryStructure structure) {
        return new SalaryStructureResponse(
                structure.getId(),
                structure.getEmployee().getId(),
                structure.getBasicSalary(),
                structure.getAllowances(),
                structure.getDeductions(),
                structure.getBonuses(),
                structure.getCreatedAt(),
                structure.getUpdatedAt()
        );
    }

    private PayrollResponse toResponse(Payroll payroll) {
        return new PayrollResponse(
                payroll.getId(),
                payroll.getEmployee().getId(),
                payroll.getEmployee().getFirstName() + " " + payroll.getEmployee().getLastName(),
                payroll.getPayrollMonth(),
                payroll.getBasicSalary(),
                payroll.getAllowances(),
                payroll.getDeductions(),
                payroll.getBonuses(),
                payroll.getGrossSalary(),
                payroll.getNetSalary(),
                payroll.getStrategyName(),
                payroll.getCreatedAt(),
                payroll.getUpdatedAt()
        );
    }
}