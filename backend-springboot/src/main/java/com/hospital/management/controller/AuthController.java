package com.hospital.management.controller;

import com.hospital.management.dto.auth.AuthResponse;
import com.hospital.management.dto.auth.ForgotPasswordRequest;
import com.hospital.management.dto.auth.LoginRequest;
import com.hospital.management.dto.auth.RegisterRequest;
import com.hospital.management.dto.auth.ResetPasswordRequest;
import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST Controller.
 * Exposes public authentication, user onboarding, password recovery, and logout endpoints.
 * Strictly delegates all security processing to AuthService.
 */
@Tag(name = "Authentication", description = "JWT token generation, login, registration, password recovery, and token refresh")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * User authentication endpoint.
     * Authenticates credentials, generates JWT access token, and returns user identity metadata.
     */
    @Operation(summary = "Authenticate user and issue JWT", description = "Verifies username/email and BCrypt password, returning signed JWT token and user identity.")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    /**
     * User registration endpoint.
     * Enforces password hashing (BCrypt) and creates new user with assigned role.
     */
    @Operation(summary = "Register new hospital user", description = "Creates a new user account with BCrypt encrypted password hash and assigned role.")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        String message = authService.register(registerRequest);
        return new ResponseEntity<>(ApiResponse.created(message, "Registration successful"), HttpStatus.CREATED);
    }

    /**
     * Forgot password recovery request.
     * Issues secure reset token without exposing user account existence.
     */
    @Operation(summary = "Initiate password recovery", description = "Generates a time-bound password reset token for valid registered email.")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message, "Password reset request processed"));
    }

    /**
     * Reset password execution.
     * Validates one-time reset token and updates password hash in database.
     */
    @Operation(summary = "Complete password reset", description = "Validates the one-time reset token and updates password with a new BCrypt hash.")
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message, "Password reset successfully"));
    }

    /**
     * Stateless JWT logout endpoint.
     * Revokes active JWT token by placing it on server-side blacklist until expiry.
     */
    @Operation(summary = "Revoke JWT and log out", description = "Places the current JWT token on server-side blacklist and clears the security context.")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        authService.logout(bearerToken);
        return ResponseEntity.ok(ApiResponse.success("Successfully logged out. Session invalidated.", "Logout successful"));
    }
}
