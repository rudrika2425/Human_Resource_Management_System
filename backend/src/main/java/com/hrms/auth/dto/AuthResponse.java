package com.hrms.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {
}
