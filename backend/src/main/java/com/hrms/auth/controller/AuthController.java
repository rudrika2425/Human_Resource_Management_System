package com.hrms.auth.controller;

import com.hrms.auth.dto.AuthResponse;
import com.hrms.auth.dto.ChangePasswordRequest;
import com.hrms.auth.dto.ForgotPasswordRequest;
import com.hrms.auth.dto.LoginRequest;
import com.hrms.auth.dto.RefreshRequest;
import com.hrms.auth.dto.RegisterRequest;
import com.hrms.auth.dto.ResetPasswordRequest;
import com.hrms.auth.dto.UserResponse;
import com.hrms.auth.service.AuthService;
import com.hrms.common.response.ApiResponse;
import com.hrms.common.security.UserPrincipal;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ApiResponse.success(
                "Login successful",
                authService.login(request)
        );
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(
            @Valid @RequestBody RefreshRequest request) {

        return ApiResponse.success(
                "Token refreshed",
                authService.refresh(request)
        );
    }

    @PostMapping("/logout")
    public ApiResponse<String> logout(
            @Valid @RequestBody RefreshRequest request) {

        authService.logout(request);

        return ApiResponse.success(
                "Logged out",
                "success"
        );
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(
            @AuthenticationPrincipal UserPrincipal principal) {

        return ApiResponse.success(
                "Current user",
                authService.me(principal)
        );
    }

    @PostMapping("/change-password")
    public ApiResponse<UserResponse> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {

        return ApiResponse.success(
                "Password updated",
                authService.changePassword(principal, request)
        );
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ApiResponse.success(
                "User created",
                authService.register(request)
        );
    }

    /*
     * FORGOT PASSWORD
     * Public endpoint.
     */
    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        authService.forgotPassword(request);

        return ApiResponse.success(
                "Password reset email sent",
                "success"
        );
    }

    /*
     * RESET PASSWORD
     * Public endpoint.
     */
    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        authService.resetPassword(request);

        return ApiResponse.success(
                "Password reset successful",
                "success"
        );
    }

    @PostMapping("/users/{userId}/activate")
    public ApiResponse<UserResponse> activate(
            @PathVariable Long userId) {

        return ApiResponse.success(
                "User activated",
                authService.activate(userId)
        );
    }

    @PostMapping("/users/{userId}/deactivate")
    public ApiResponse<UserResponse> deactivate(
            @PathVariable Long userId) {

        return ApiResponse.success(
                "User deactivated",
                authService.deactivate(userId)
        );
    }
}