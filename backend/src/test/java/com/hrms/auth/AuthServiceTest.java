
package com.hrms.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.hrms.attendance.service.AttendanceService;
import com.hrms.auth.dto.RegisterRequest;
import com.hrms.auth.entity.User;
import com.hrms.auth.entity.UserRole;
import com.hrms.auth.repository.RefreshTokenRepository;
import com.hrms.auth.repository.UserRepository;
import com.hrms.auth.service.AuthService;
import com.hrms.common.security.JwtService;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.repository.EmployeeRepository;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;


    @Mock
    private EmployeeRepository employeeRepository;

    /*
     * AttendanceService was added to AuthService
     * for automatic check-in/check-out.
     */
    @Mock
    private AttendanceService attendanceService;

    private AuthService authService;

    @BeforeEach
    void setUp() {

        authService = new AuthService(
        userRepository,
        refreshTokenRepository,
        passwordEncoder,
        authenticationManager,
        jwtService,
        employeeRepository,
        attendanceService
);
    }

    @Test
    void registerHashesPasswordAndReturnsTokensWhenEmployeeEmailExists() {

        RegisterRequest request = new RegisterRequest(
                "john@hrms.local",
                "John",
                "Doe",
                "password123"
        );

        Employee employee = Employee.builder()
                .email("john@hrms.local")
                .assignedRole(UserRole.EMPLOYEE)
                .build();

        when(employeeRepository.existsByEmailIgnoreCase("john@hrms.local"))
                .thenReturn(true);

        when(employeeRepository.findByEmailIgnoreCase("john@hrms.local"))
                .thenReturn(java.util.Optional.of(employee));

        when(passwordEncoder.encode("password123"))
                .thenReturn("hashed-password");

        when(jwtService.generateAccessToken(any()))
                .thenReturn("access-token");

        when(jwtService.generateRefreshToken(any()))
                .thenReturn("refresh-token");

        Claims claims = org.mockito.Mockito.mock(Claims.class);

        when(jwtService.parseClaims("refresh-token"))
                .thenReturn(claims);

        when(claims.getExpiration())
                .thenReturn(
                        Date.from(
                                Instant.now().plusSeconds(3600)
                        )
                );

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);
                    user.setId(1L);
                    return user;
                });

        when(refreshTokenRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = authService.register(request);

        assertThat(response.accessToken())
                .isEqualTo("access-token");

        assertThat(response.refreshToken())
                .isEqualTo("refresh-token");

        assertThat(response.user().email())
                .isEqualTo("john@hrms.local");

        assertThat(response.user().roles())
                .contains(UserRole.EMPLOYEE);
    }
}
