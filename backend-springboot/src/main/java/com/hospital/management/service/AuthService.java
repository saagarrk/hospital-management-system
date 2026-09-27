package com.hospital.management.service;

import com.hospital.management.dto.auth.AuthResponse;
import com.hospital.management.dto.auth.ForgotPasswordRequest;
import com.hospital.management.dto.auth.LoginRequest;
import com.hospital.management.dto.auth.RegisterRequest;
import com.hospital.management.dto.auth.ResetPasswordRequest;

/**
 * Authentication and Authorization Service interface.
 * Encapsulates all identity verification, user registration,
 * password recovery lifecycle, and JWT token issuance and revocation.
 */
public interface AuthService {

    /**
     * Authenticates user credentials via AuthenticationManager, builds JWT token and returns AuthResponse.
     */
    AuthResponse login(LoginRequest loginRequest);

    /**
     * Registers a new user with BCrypt hashed password and assigned role.
     */
    String register(RegisterRequest registerRequest);

    /**
     * Initiates password reset by issuing a cryptographically secure reset token.
     */
    String forgotPassword(ForgotPasswordRequest request);

    /**
     * Verifies reset token and updates user password with BCrypt hash.
     */
    String resetPassword(ResetPasswordRequest request);

    /**
     * Revokes active JWT token by adding it to the blacklist cache until expiration.
     */
    void logout(String bearerToken);
}
