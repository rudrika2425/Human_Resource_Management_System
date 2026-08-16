package com.hrms.auth.service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.hrms.auth.dto.AuthResponse;
import com.hrms.auth.dto.ChangePasswordRequest;
import com.hrms.auth.dto.LoginRequest;
import com.hrms.auth.dto.RefreshRequest;
import com.hrms.auth.dto.RegisterRequest;
import com.hrms.auth.dto.UserResponse;
import com.hrms.auth.entity.RefreshToken;
import com.hrms.auth.entity.User;
import com.hrms.auth.entity.UserRole;
import com.hrms.auth.repository.RefreshTokenRepository;
import com.hrms.auth.repository.UserRepository;
import com.hrms.attendance.service.AttendanceService;
import com.hrms.common.exception.BadRequestException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.common.exception.UnauthorizedException;
import com.hrms.common.security.JwtService;
import com.hrms.common.security.UserPrincipal;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.repository.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmployeeRepository employeeRepository;
    private final AttendanceService attendanceService;

    
    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       EmployeeRepository employeeRepository,
                       AttendanceService attendanceService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.employeeRepository = employeeRepository;
        this.attendanceService = attendanceService;
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!user.isActive()) {
            throw new UnauthorizedException("User account is deactivated");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setTokenHash(refreshToken);
        refreshTokenEntity.setExpiresAt(Instant.now().plusSeconds(86400)); 
        refreshTokenRepository.save(refreshTokenEntity);

        
        attendanceService.checkInForLogin(user.getEmail());

        return new AuthResponse(accessToken, refreshToken, getUserResponse(user));
    }

    public AuthResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();
        
        if (!jwtService.isValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        RefreshToken tokenEntity = refreshTokenRepository.findByTokenHash(refreshToken)
                .orElseThrow(() -> new UnauthorizedException("Refresh token not found"));

        if (tokenEntity.isRevoked() || tokenEntity.isExpired()) {
            throw new UnauthorizedException("Refresh token is revoked or expired");
        }

        User user = tokenEntity.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        
        tokenEntity.setRevokedAt(Instant.now());
        refreshTokenRepository.save(tokenEntity);

        
        RefreshToken newTokenEntity = new RefreshToken();
        newTokenEntity.setUser(user);
        newTokenEntity.setTokenHash(newRefreshToken);
        newTokenEntity.setExpiresAt(Instant.now().plusSeconds(86400));
        refreshTokenRepository.save(newTokenEntity);

        return new AuthResponse(newAccessToken, newRefreshToken, getUserResponse(user));
    }

    public void logout(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();
        RefreshToken tokenEntity = refreshTokenRepository.findByTokenHash(refreshToken)
                .orElse(null);

        if (tokenEntity != null && !tokenEntity.isRevoked()) {
            tokenEntity.setRevokedAt(Instant.now());
            refreshTokenRepository.save(tokenEntity);
        }

        
        String email = jwtService.getEmail(refreshToken);
        if (email != null) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                employeeRepository.findByUserId(user.getId())
                        .ifPresent(employee -> attendanceService.checkOutIfCheckedIn(employee.getId()));
            }
        }
    }

    



public UserResponse me(UserPrincipal principal) {
    
    if (principal == null) {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            principal = (UserPrincipal) authentication.getPrincipal();
        } else {
            throw new UnauthorizedException("User not authenticated");
        }
    }
    
    User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new NotFoundException("User not found"));
    return getUserResponse(user);
}

    public UserResponse changePassword(UserPrincipal principal, ChangePasswordRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return getUserResponse(user);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setActive(true);
        user.setRoles(Set.of(UserRole.EMPLOYEE));
        userRepository.save(user);

        
        Employee employee = new Employee();
        employee.setUser(user);
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setActive(true);
        employee.setDeleted(false);
        employee.setEmployeeId("EMP" + System.currentTimeMillis());
        employeeRepository.save(employee);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setTokenHash(refreshToken);
        refreshTokenEntity.setExpiresAt(Instant.now().plusSeconds(86400));
        refreshTokenRepository.save(refreshTokenEntity);

        return new AuthResponse(accessToken, refreshToken, getUserResponse(user));
    }

    public UserResponse activate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        user.setActive(true);
        userRepository.save(user);

        return getUserResponse(user);
    }

    public UserResponse deactivate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        user.setActive(false);
        userRepository.save(user);

        return getUserResponse(user);
    }

    private UserResponse getUserResponse(User user) {
    Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
    return new UserResponse(user, employee);
}
}