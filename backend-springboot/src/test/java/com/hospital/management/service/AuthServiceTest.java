package com.hospital.management.service;

import com.hospital.management.dto.auth.AuthResponse;
import com.hospital.management.dto.auth.ForgotPasswordRequest;
import com.hospital.management.dto.auth.LoginRequest;
import com.hospital.management.dto.auth.RegisterRequest;
import com.hospital.management.dto.auth.ResetPasswordRequest;
import com.hospital.management.entity.PasswordResetToken;
import com.hospital.management.entity.User;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.repository.PasswordResetTokenRepository;
import com.hospital.management.repository.UserRepository;
import com.hospital.management.security.JwtService;
import com.hospital.management.security.TokenBlacklistService;
import com.hospital.management.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Business Logic Tests")
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .password("$2a$10$encryptedPasswordHash")
                .fullName("John Doe")
                .role(Role.PATIENT)
                .enabled(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("Authentication / Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should successfully authenticate user and return JWT access token")
        void login_Success() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setUsernameOrEmail("john_doe");
            request.setPassword("SecurePass123!");

            Authentication authentication = mock(Authentication.class);
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(jwtService.generateToken(authentication)).thenReturn("mocked.jwt.token");
            when(jwtService.getExpirationDurationMs()).thenReturn(86400000L);
            when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(sampleUser));

            // Act
            AuthResponse response = authService.login(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("mocked.jwt.token");
            assertThat(response.getUsername()).isEqualTo("john_doe");
            assertThat(response.getEmail()).isEqualTo("john@example.com");
            assertThat(response.getRole()).isEqualTo("PATIENT");
            assertThat(response.getUserId()).isEqualTo(1L);

            verify(auditLogService, times(1)).recordEvent(
                    eq("john_doe"), eq("PATIENT"), eq("LOGIN"), eq("USER"), eq(1L), eq("SUCCESS"), any()
            );
        }

        @Test
        @DisplayName("Should fail authentication when invalid credentials are provided")
        void login_InvalidCredentials_ThrowsBadCredentialsException() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setUsernameOrEmail("john_doe");
            request.setPassword("WrongPassword");

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessage("Bad credentials");

            verify(jwtService, never()).generateToken(any());
        }
    }

    @Nested
    @DisplayName("User Registration & Role Assignment Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Should register new patient account with encrypted password")
        void register_Success_CreatesPatientUser() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("new_patient");
            request.setEmail("patient@hospital.com");
            request.setPassword("StrongPass123!");
            request.setFullName("Jane Doe");
            request.setPhone("555-1234");

            when(userRepository.existsByUsername("new_patient")).thenReturn(false);
            when(userRepository.existsByEmail("patient@hospital.com")).thenReturn(false);
            when(passwordEncoder.encode("StrongPass123!")).thenReturn("$2a$10$hashedPassword");

            // Act
            String result = authService.register(request);

            // Assert
            assertThat(result).contains("User registered successfully");
            verify(userRepository, times(1)).save(argThat(u ->
                    u.getUsername().equals("new_patient") &&
                    u.getPassword().equals("$2a$10$hashedPassword") &&
                    u.getRole() == Role.PATIENT &&
                    u.isEnabled()
            ));
        }

        @Test
        @DisplayName("Should reject registration when username is already taken")
        void register_DuplicateUsername_ThrowsConflictException() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("existing_user");
            request.setEmail("new@hospital.com");
            request.setPassword("Pass123!");

            when(userRepository.existsByUsername("existing_user")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already taken");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject registration when email is already registered")
        void register_DuplicateEmail_ThrowsConflictException() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("unique_user");
            request.setEmail("existing@hospital.com");
            request.setPassword("Pass123!");

            when(userRepository.existsByUsername("unique_user")).thenReturn(false);
            when(userRepository.existsByEmail("existing@hospital.com")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already registered");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should force PATIENT role when unauthenticated user attempts to self-assign ADMIN role")
        void register_PublicPrivilegedRoleAttempt_ForcesPatientRole() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("sneaky_user");
            request.setEmail("sneaky@hospital.com");
            request.setPassword("Pass123!");
            request.setRole(Role.ADMIN);

            when(userRepository.existsByUsername("sneaky_user")).thenReturn(false);
            when(userRepository.existsByEmail("sneaky@hospital.com")).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");

            // Act
            authService.register(request);

            // Assert: role must be overridden to PATIENT
            verify(userRepository).save(argThat(user -> user.getRole() == Role.PATIENT));
        }

        @Test
        @DisplayName("Should allow ADMIN user to provision staff accounts with privileged roles")
        void register_AdminUser_AllowsStaffRoleProvisioning() {
            // Arrange
            Authentication adminAuth = mock(Authentication.class);
            doReturn(true).when(adminAuth).isAuthenticated();
            doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(adminAuth).getAuthorities();

            SecurityContext context = mock(SecurityContext.class);
            when(context.getAuthentication()).thenReturn(adminAuth);
            SecurityContextHolder.setContext(context);

            RegisterRequest request = new RegisterRequest();
            request.setUsername("new_doctor");
            request.setEmail("doc@hospital.com");
            request.setPassword("DocPass123!");
            request.setRole(Role.DOCTOR);

            when(userRepository.existsByUsername("new_doctor")).thenReturn(false);
            when(userRepository.existsByEmail("doc@hospital.com")).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");

            // Act
            authService.register(request);

            // Assert
            verify(userRepository).save(argThat(user -> user.getRole() == Role.DOCTOR));
        }
    }

    @Nested
    @DisplayName("Password Reset & User Enumeration Protection")
    class PasswordRecoveryTests {

        @Test
        @DisplayName("Should issue reset token and return generic message for existing email")
        void forgotPassword_ExistingUser_GeneratesToken() {
            // Arrange
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("john@example.com");

            when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));

            // Act
            String message = authService.forgotPassword(request);

            // Assert
            assertThat(message).contains("If that email address exists in our database");
            verify(passwordResetTokenRepository).deleteByUser(sampleUser);
            verify(passwordResetTokenRepository).save(argThat(token ->
                    token.getUser().equals(sampleUser) &&
                    !token.isUsed() &&
                    token.getExpiryDate().isAfter(LocalDateTime.now())
            ));
        }

        @Test
        @DisplayName("Should return generic success message when email is not found to prevent user enumeration")
        void forgotPassword_NonExistentUser_ReturnsGenericMessageWithoutLeakingAccountStatus() {
            // Arrange
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("nonexistent@example.com");

            when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

            // Act
            String message = authService.forgotPassword(request);

            // Assert
            assertThat(message).contains("If that email address exists in our database");
            verify(passwordResetTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should successfully reset password when token is valid")
        void resetPassword_ValidToken_UpdatesPasswordAndInvalidatesToken() {
            // Arrange
            ResetPasswordRequest request = new ResetPasswordRequest();
            request.setResetToken("valid-token-uuid");
            request.setNewPassword("BrandNewPassword123!");

            PasswordResetToken token = PasswordResetToken.builder()
                    .token("valid-token-uuid")
                    .user(sampleUser)
                    .expiryDate(LocalDateTime.now().plusMinutes(20))
                    .used(false)
                    .build();

            when(passwordResetTokenRepository.findByToken("valid-token-uuid")).thenReturn(Optional.of(token));
            when(passwordEncoder.encode("BrandNewPassword123!")).thenReturn("$2a$10$newEncryptedPassword");

            // Act
            String result = authService.resetPassword(request);

            // Assert
            assertThat(result).contains("Password has been successfully reset");
            assertThat(sampleUser.getPassword()).isEqualTo("$2a$10$newEncryptedPassword");
            assertThat(token.isUsed()).isTrue();
            verify(userRepository).save(sampleUser);
            verify(passwordResetTokenRepository).save(token);
        }

        @Test
        @DisplayName("Should reject password reset when token has already been used")
        void resetPassword_AlreadyUsedToken_ThrowsBusinessRuleException() {
            // Arrange
            ResetPasswordRequest request = new ResetPasswordRequest();
            request.setResetToken("used-token");
            request.setNewPassword("NewPass123!");

            PasswordResetToken token = PasswordResetToken.builder()
                    .token("used-token")
                    .user(sampleUser)
                    .expiryDate(LocalDateTime.now().plusMinutes(10))
                    .used(true)
                    .build();

            when(passwordResetTokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

            // Act & Assert
            assertThatThrownBy(() -> authService.resetPassword(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("already been used");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject password reset when token has expired")
        void resetPassword_ExpiredToken_ThrowsBusinessRuleException() {
            // Arrange
            ResetPasswordRequest request = new ResetPasswordRequest();
            request.setResetToken("expired-token");
            request.setNewPassword("NewPass123!");

            PasswordResetToken token = PasswordResetToken.builder()
                    .token("expired-token")
                    .user(sampleUser)
                    .expiryDate(LocalDateTime.now().minusMinutes(5)) // Expired
                    .used(false)
                    .build();

            when(passwordResetTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

            // Act & Assert
            assertThatThrownBy(() -> authService.resetPassword(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("expired");

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should extract token expiration and add to blacklist on logout")
        void logout_ValidBearerToken_BlacklistsToken() {
            // Arrange
            String token = "Bearer sample.jwt.token";
            Date expiry = new Date(System.currentTimeMillis() + 3600000);
            when(jwtService.extractExpiration("sample.jwt.token")).thenReturn(expiry);

            // Act
            authService.logout(token);

            // Assert
            verify(tokenBlacklistService).blacklistToken("sample.jwt.token", expiry);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        }
    }
}
