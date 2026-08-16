package com.hrms.common.bootstrap;

import com.hrms.attendance.entity.Attendance;
import com.hrms.attendance.entity.AttendanceStatus;
import com.hrms.attendance.repository.AttendanceRepository;
import com.hrms.auth.entity.User;
import com.hrms.auth.entity.UserRole;
import com.hrms.auth.repository.UserRepository;
import com.hrms.department.entity.Department;
import com.hrms.department.repository.DepartmentRepository;
import com.hrms.designation.entity.Designation;
import com.hrms.designation.repository.DesignationRepository;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.entity.EmploymentStatus;
import com.hrms.employee.entity.EmploymentType;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.leave.entity.LeaveBalance;
import com.hrms.leave.entity.LeaveRequest;
import com.hrms.leave.entity.LeaveStatus;
import com.hrms.leave.entity.LeaveType;
import com.hrms.leave.repository.LeaveBalanceRepository;
import com.hrms.leave.repository.LeaveRequestRepository;
import com.hrms.payroll.entity.SalaryStructure;
import com.hrms.payroll.repository.SalaryStructureRepository;
import com.hrms.performance.entity.Goal;
import com.hrms.performance.entity.GoalStatus;
import com.hrms.performance.entity.PriorityLevel;
import com.hrms.performance.repository.GoalRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Component
@Transactional
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final GoalRepository goalRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.email:hr@hrms.local}")
    private String adminEmail;

    @Value("${app.bootstrap-admin.password:Admin@12345}")
    private String adminPassword;

    // Constructor Injection - NO @Autowired needed
    public DataSeeder(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            DesignationRepository designationRepository,
            EmployeeRepository employeeRepository,
            AttendanceRepository attendanceRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            SalaryStructureRepository salaryStructureRepository,
            GoalRepository goalRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.goalRepository = goalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {

        /*
         * ============================================================
         * ADMIN USER
         * ============================================================
         */
        String normalizedEmail = adminEmail.toLowerCase();

        User admin = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> {
                    User newAdmin = new User();
                    newAdmin.setEmail(normalizedEmail);
                    newAdmin.setFirstName("System");
                    newAdmin.setLastName("Admin");
                    newAdmin.setPassword(passwordEncoder.encode(adminPassword));
                    newAdmin.setActive(true);
                    newAdmin.setRoles(Set.of(UserRole.HR));
                    return userRepository.save(newAdmin);
                });

        /*
         * ============================================================
         * DEPARTMENTS
         * ============================================================
         */
        Department hrDepartment = departmentRepository.findByName("HR")
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setName("HR");
                    dept.setDescription("Handles recruitment, employee relations, payroll support, and HR operations.");
                    dept.setActive(true);
                    return departmentRepository.save(dept);
                });

        Department itDepartment = departmentRepository.findByName("Information Technology")
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setName("Information Technology");
                    dept.setDescription("Responsible for software development, infrastructure, and technical support.");
                    dept.setActive(true);
                    return departmentRepository.save(dept);
                });

        Department financeDepartment = departmentRepository.findByName("Finance")
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setName("Finance");
                    dept.setDescription("Manages accounting, budgeting, taxation, and financial reporting.");
                    dept.setActive(true);
                    return departmentRepository.save(dept);
                });

        Department salesDepartment = departmentRepository.findByName("Sales")
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setName("Sales");
                    dept.setDescription("Drives revenue growth through customer acquisition and sales management.");
                    dept.setActive(true);
                    return departmentRepository.save(dept);
                });

        Department operationsDepartment = departmentRepository.findByName("Operations")
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setName("Operations");
                    dept.setDescription("Oversees daily business operations and process optimization.");
                    dept.setActive(true);
                    return departmentRepository.save(dept);
                });

        /*
         * ============================================================
         * DESIGNATIONS
         * ============================================================
         */
        Designation hrManager = designationRepository
                .findByNameAndDepartment("HR Manager", hrDepartment)
                .orElseGet(() -> {
                    Designation desig = new Designation();
                    desig.setName("HR Manager");
                    desig.setDepartment(hrDepartment);
                    desig.setDescription("Leads HR operations");
                    desig.setLevel(5);
                    desig.setActive(true);
                    return designationRepository.save(desig);
                });

        Designation hrExecutive = designationRepository
                .findByNameAndDepartment("HR Executive", hrDepartment)
                .orElseGet(() -> {
                    Designation desig = new Designation();
                    desig.setName("HR Executive");
                    desig.setDepartment(hrDepartment);
                    desig.setDescription("Handles recruitment and employee records");
                    desig.setLevel(3);
                    desig.setActive(true);
                    return designationRepository.save(desig);
                });

        Designation softwareEngineer = designationRepository
                .findByNameAndDepartment("Software Engineer", itDepartment)
                .orElseGet(() -> {
                    Designation desig = new Designation();
                    desig.setName("Software Engineer");
                    desig.setDepartment(itDepartment);
                    desig.setDescription("Develops and maintains software applications");
                    desig.setLevel(2);
                    desig.setActive(true);
                    return designationRepository.save(desig);
                });

        Designation financeManager = designationRepository
                .findByNameAndDepartment("Finance Manager", financeDepartment)
                .orElseGet(() -> {
                    Designation desig = new Designation();
                    desig.setName("Finance Manager");
                    desig.setDepartment(financeDepartment);
                    desig.setDescription("Manages financial planning and reporting");
                    desig.setLevel(4);
                    desig.setActive(true);
                    return designationRepository.save(desig);
                });

        Designation salesManager = designationRepository
                .findByNameAndDepartment("Sales Manager", salesDepartment)
                .orElseGet(() -> {
                    Designation desig = new Designation();
                    desig.setName("Sales Manager");
                    desig.setDepartment(salesDepartment);
                    desig.setDescription("Leads the sales team and business development");
                    desig.setLevel(4);
                    desig.setActive(true);
                    return designationRepository.save(desig);
                });

        /*
         * ============================================================
         * EMPLOYEE
         * ============================================================
         */
        Employee employee = employeeRepository.findByEmployeeId("EMP-001")
                .orElseGet(() -> {
                    Employee emp = new Employee();
                    emp.setEmployeeId("EMP-001");
                    emp.setFirstName("System");
                    emp.setLastName("Admin");
                    emp.setEmail(normalizedEmail);
                    emp.setPhone("9999999999");
                    emp.setJoiningDate(LocalDate.now().minusYears(1));
                    emp.setDepartment(hrDepartment);
                    emp.setDesignation(hrManager);
                    emp.setEmploymentType(EmploymentType.FULL_TIME);
                    emp.setEmploymentStatus(EmploymentStatus.ACTIVE);
                    emp.setWorkLocation("Remote");
                    emp.setAssignedRole(UserRole.HR);
                    emp.setActive(true);
                    emp.setDeleted(false);
                    return employeeRepository.save(emp);
                });

        /*
         * ============================================================
         * SALARY STRUCTURE
         * ============================================================
         */
        if (!salaryStructureRepository.existsByEmployee(employee)) {
            SalaryStructure salary = new SalaryStructure();
            salary.setEmployee(employee);
            salary.setBasicSalary(60000.0);
            salary.setAllowances(10000.0);
            salary.setDeductions(2000.0);
            salary.setBonuses(5000.0);
            salaryStructureRepository.save(salary);
        }

        /*
         * ============================================================
         * ATTENDANCE
         * ============================================================
         */
        LocalDate today = LocalDate.now();

        if (!attendanceRepository.existsByEmployeeAndWorkDate(employee, today)) {
            Attendance attendance = new Attendance();
            attendance.setEmployee(employee);
            attendance.setWorkDate(today);
            attendance.setCheckInAt(LocalDateTime.now().withHour(9).withMinute(15).withSecond(0).withNano(0));
            attendance.setCheckOutAt(LocalDateTime.now().withHour(18).withMinute(0).withSecond(0).withNano(0));
            attendance.setStatus(AttendanceStatus.PRESENT);
            attendance.setWorkedMinutes(525L);
            attendanceRepository.save(attendance);
        }

        /*
         * ============================================================
         * LEAVE BALANCE
         * ============================================================
         */
        if (!leaveBalanceRepository.existsByEmployeeAndLeaveType(employee, LeaveType.ANNUAL)) {
            LeaveBalance leaveBalance = new LeaveBalance();
            leaveBalance.setEmployee(employee);
            leaveBalance.setLeaveType(LeaveType.ANNUAL);
            leaveBalance.setAvailableDays(12);
            leaveBalance.setUsedDays(2);
            leaveBalanceRepository.save(leaveBalance);
        }

        /*
         * ============================================================
         * LEAVE REQUEST
         * ============================================================
         */
        LocalDate leaveStartDate = today.plusDays(7);

        if (!leaveRequestRepository.existsByEmployeeAndLeaveTypeAndStartDate(
                employee, LeaveType.CASUAL, leaveStartDate)) {
            LeaveRequest leaveRequest = new LeaveRequest();
            leaveRequest.setEmployee(employee);
            leaveRequest.setLeaveType(LeaveType.CASUAL);
            leaveRequest.setStartDate(leaveStartDate);
            leaveRequest.setEndDate(today.plusDays(8));
            leaveRequest.setReason("Family time");
            leaveRequest.setStatus(LeaveStatus.PENDING);
            leaveRequestRepository.save(leaveRequest);
        }

        /*
         * ============================================================
         * GOALS
         * ============================================================
         */
        if (!goalRepository.existsByTitleAndEmployee("Reduce onboarding time", employee)) {
            Goal goal = new Goal();
            goal.setTitle("Reduce onboarding time");
            goal.setDescription("Improve onboarding process");
            goal.setTarget("20% faster");
            goal.setDueDate(today.plusMonths(2));
            goal.setPriority(PriorityLevel.HIGH);
            goal.setStatus(GoalStatus.IN_PROGRESS);
            goal.setEmployee(employee);
            goal.setManager(employee);
            goalRepository.save(goal);
        }

        System.out.println("✅ Data seeding completed successfully!");
        System.out.println("📧 Admin Email: " + normalizedEmail);
        System.out.println("🔑 Admin Password: " + adminPassword);
    }
}