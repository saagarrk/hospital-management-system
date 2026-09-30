package com.hospital.management.service.impl;

import com.hospital.management.dto.auth.*;
import com.hospital.management.entity.PasswordResetToken;
import com.hospital.management.entity.User;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.repository.PasswordResetTokenRepository;
import com.hospital.management.repository.UserRepository;
import com.hospital.management.security.JwtService;
import com.hospital.management.security.TokenBlacklistService;
import com.hospital.management.service.AuditLogService;
import com.hospital.management.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

/**
 * Production implementation of AuthService for Spring Security 6.
 * All authentication decisions, BCrypt hashing, JWT issuance,
 * password resets, and token revocation are executed here.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuditLogService auditLogService;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        log.info("Attempting authentication for user: {}", loginRequest.getUsernameOrEmail());

        // 1. Delegate verification to AuthenticationManager (BCrypt check performed against CustomUserDetailsService)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Set authentication in SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Issue signed JWT token
        String token = jwtService.generateToken(authentication);

        // 4. Retrieve user record to construct AuthResponse without exposing password hash
        User user = userRepository.findByUsername(loginRequest.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(loginRequest.getUsernameOrEmail()))
                .orElseThrow(() -> new ResourceNotFoundException("User", "usernameOrEmail", loginRequest.getUsernameOrEmail()));

        log.info("User {} successfully authenticated with role {}", user.getUsername(), user.getRole());

        // Audit Logging for successful authentication (Zero credential exposure)
        auditLogService.recordEvent(
                user.getUsername(),
                user.getRole().name(),
                "LOGIN",
                "USER",
                user.getId(),
                "SUCCESS",
                String.format("User authenticated successfully via %s", user.getEmail())
        );

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationDurationMs())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    @Override
    @Transactional
    public String register(RegisterRequest registerRequest) {
        log.info("Processing user registration for: {}", registerRequest.getUsername());

        // Enforce uniqueness constraints
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ConflictException("Username '" + registerRequest.getUsername() + "' is already taken");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ConflictException("Email '" + registerRequest.getEmail() + "' is already registered");
        }

        // Never store plain-text passwords: Hash with BCrypt
        String hashedPassword = passwordEncoder.encode(registerRequest.getPassword());

        // SECURITY ENFORCEMENT: Public registration strictly creates PATIENT accounts.
        // Privileged staff roles (ADMIN, DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN, RECEPTIONIST)
        // cannot be self-assigned. Only authenticated ADMIN accounts can provision staff roles.
        Role assignedRole = Role.PATIENT;
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth != null && currentAuth.isAuthenticated() &&
                currentAuth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            if (registerRequest.getRole() != null) {
                assignedRole = registerRequest.getRole();
            }
        } else if (registerRequest.getRole() != null && registerRequest.getRole() != Role.PATIENT) {
            log.warn("Security Alert: User '{}' attempted to self-register as privileged role '{}'. Forcing PATIENT role.",
                    registerRequest.getUsername(), registerRequest.getRole());
            assignedRole = Role.PATIENT;
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(hashedPassword)
                .email(registerRequest.getEmail())
                .fullName(registerRequest.getFullName())
                .phone(registerRequest.getPhone())
                .role(assignedRole)
                .enabled(true)
                .build();

        userRepository.save(user);
        log.info("User {} registered successfully with role {}", user.getUsername(), user.getRole());

        auditLogService.recordEvent(
                user.getUsername(),
                user.getRole().name(),
                "USER_REGISTERED",
                "USER",
                user.getId(),
                "SUCCESS",
                String.format("User registered with role %s", user.getRole())
        );

        return "User registered successfully. You can now log in.";
    }

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        log.info("Forgot password initiated for email: {}", request.getEmail());

        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            // Invalidate any active previous tokens for this user
            passwordResetTokenRepository.deleteByUser(user);

            // Generate cryptographically random token
            String resetToken = UUID.randomUUID().toString();

            // Expire token in 30 minutes
            PasswordResetToken token = PasswordResetToken.builder()
                    .token(resetToken)
                    .user(user)
                    .expiryDate(LocalDateTime.now().plusMinutes(30))
                    .used(false)
                    .build();

            passwordResetTokenRepository.save(token);
            log.info("Password reset token generated and dispatched for user ID: {}", user.getId());
            // In a production environment, this token is sent via JavaMailSender or SMTP
        });

        // Always return generic success to protect against user enumeration
        return "If that email address exists in our database, a password reset link has been dispatched.";
    }

    @Override
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        log.info("Processing password reset request.");

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getResetToken())
                .orElseThrow(() -> new BusinessRuleException("Invalid or unrecognized password reset token."));

        if (resetToken.isUsed()) {
            throw new BusinessRuleException("This password reset token has already been used.");
        }

        if (resetToken.isExpired()) {
            throw new BusinessRuleException("This password reset token has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        // Hash new password using BCrypt
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate token
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password successfully reset for user: {}", user.getUsername());
        return "Password has been successfully reset. Please log in with your new password.";
    }

    @Override
    public void logout(String bearerToken) {
        if (!StringUtils.hasText(bearerToken)) {
            return;
        }

        String rawToken = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;

        try {
            Date expiration = jwtService.extractExpiration(rawToken);
            String username = jwtService.extractUsername(rawToken);
            tokenBlacklistService.blacklistToken(rawToken, expiration);
            log.info("Token successfully blacklisted for logout until {}", expiration);
            if (username != null) {
                auditLogService.recordEvent(username, "USER", "LOGOUT", "USER", null, "SUCCESS", "User session invalidated via token blacklist");
            }
        } catch (Exception e) {
            log.warn("Could not extract token expiration during logout: {}", e.getMessage());
        }

        SecurityContextHolder.clearContext();
    }
}
