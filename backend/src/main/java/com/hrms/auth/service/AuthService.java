package com.hrms.auth.service;
import org.springframework.security.core.context.SecurityContextHolder;
import com.hrms.auth.dto.AuthResponse;
import com.hrms.auth.dto.ChangePasswordRequest;
import com.hrms.auth.dto.LoginRequest;
import com.hrms.auth.dto.ForgotPasswordRequest; 
import com.hrms.auth.dto.ResetPasswordRequest;  
import com.hrms.auth.entity.PasswordResetToken;
import com.hrms.auth.repository.PasswordResetTokenRepository;
import com.hrms.common.service.EmailService;
import org.springframework.beans.factory.annotation.Value;  
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
import java.util.UUID; 
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
    private final PasswordResetTokenRepository passwordResetTokenRepository; 
    private final EmailService emailService; 

    @Value("${app.reset-password.token-expiry-minutes:15}")  // ADD THIS
    private int tokenExpiryMinutes;

    
    public AuthService(UserRepository userRepository,
                   RefreshTokenRepository refreshTokenRepository,
                   PasswordEncoder passwordEncoder,
                   AuthenticationManager authenticationManager,
                   JwtService jwtService,
                   EmployeeRepository employeeRepository,
                   AttendanceService attendanceService,
                   PasswordResetTokenRepository passwordResetTokenRepository, 
                   EmailService emailService) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.employeeRepository = employeeRepository;
    this.attendanceService = attendanceService;
    this.passwordResetTokenRepository = passwordResetTokenRepository;  
    this.emailService = emailService;
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

    String email = request.getEmail().trim().toLowerCase();

    System.out.println("REGISTER: starting for email = " + email);

    // 1. User must not already exist
    if (userRepository.existsByEmailIgnoreCase(email)) {
        throw new BadRequestException("Email already registered");
    }

    // 2. Employee must already exist because HR creates employees first
    Employee employee = employeeRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException(
                    "No employee found with this email. Please contact HR."
            ));

    // 3. Employee can register only once
    if (employee.getUser() != null) {
        throw new BadRequestException("This employee is already registered");
    }

    // 4. Employee must be active
    if (!employee.isActive() || employee.isDeleted()) {
        throw new BadRequestException(
                "This employee account is inactive. Please contact HR."
        );
    }

    System.out.println("REGISTER: existing employee found, id = " + employee.getId());

    // 5. Create User account
    User user = new User();
    user.setEmail(email);
    user.setPassword(passwordEncoder.encode(request.getPassword()));

    // Use employee's existing name rather than creating/changing
    // employee information during registration.
    user.setFirstName(employee.getFirstName());
    user.setLastName(employee.getLastName());

    user.setActive(true);

    // Employee's role was assigned by HR.
    // Do NOT blindly force EMPLOYEE here.
    UserRole role = employee.getAssignedRole();

    if (role == null) {
        role = UserRole.EMPLOYEE;
    }

    user.setRoles(Set.of(role));

    System.out.println("REGISTER: creating user");

    userRepository.save(user);

    System.out.println("REGISTER: user saved, id = " + user.getId());

    // 6. Link the EXISTING employee to the newly created user
    employee.setUser(user);

    // Keep HR-assigned employee data unchanged.
    employeeRepository.save(employee);

    System.out.println(
            "REGISTER: existing employee linked to user, employee id = "
                    + employee.getId()
    );

    // 7. Generate tokens
    String accessToken = jwtService.generateAccessToken(user);
    String refreshToken = jwtService.generateRefreshToken(user);

    // 8. Save refresh token
    RefreshToken refreshTokenEntity = new RefreshToken();
    refreshTokenEntity.setUser(user);
    refreshTokenEntity.setTokenHash(refreshToken);
    refreshTokenEntity.setExpiresAt(Instant.now().plusSeconds(86400));

    refreshTokenRepository.save(refreshTokenEntity);

    System.out.println("REGISTER: registration completed");

    return new AuthResponse(
            accessToken,
            refreshToken,
            getUserResponse(user)
    );
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
 public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User not found with this email"));
        
        // Delete any existing reset tokens for this user
        passwordResetTokenRepository.deleteByUser_Id(user.getId());
        
        // Generate reset token
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(tokenExpiryMinutes * 60);
        
        PasswordResetToken resetToken = new PasswordResetToken(token, user, expiresAt);
        passwordResetTokenRepository.save(resetToken);
        
        // Get employee name for email
        String name = user.getFirstName() + " " + user.getLastName();
        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        if (employee != null) {
            name = employee.getFirstName() + " " + employee.getLastName();
        }
        
        // SEND EMAIL (REAL)
        emailService.sendPasswordResetEmail(email, token, name);
    }

    public void resetPassword(ResetPasswordRequest request) {
        // Validate passwords match
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }
        
        // Find the token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));
        
        // Check if token is expired
        if (resetToken.isExpired()) {
            throw new BadRequestException("Reset token has expired");
        }
        
        // Check if token is already used
        if (resetToken.isUsed()) {
            throw new BadRequestException("Reset token has already been used");
        }
        
        // Get the user
        User user = resetToken.getUser();
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);
        
        // Invalidate all refresh tokens for this user (force re-login)
        refreshTokenRepository.deleteByUser_Id(user.getId());
    }
}