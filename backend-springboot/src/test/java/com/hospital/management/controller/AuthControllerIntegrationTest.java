package com.hospital.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.management.dto.auth.AuthResponse;
import com.hospital.management.dto.auth.LoginRequest;
import com.hospital.management.dto.auth.RegisterRequest;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.GlobalExceptionHandler;
import com.hospital.management.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController REST Endpoint Integration Tests")
class AuthControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/auth/login - Success (HTTP 200)")
    void login_Success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail("admin");
        request.setPassword("AdminPass123!");

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mocked-jwt-token-string")
                .tokenType("Bearer")
                .userId(1L)
                .username("admin")
                .role("ADMIN")
                .fullName("System Administrator")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.accessToken").value("mocked-jwt-token-string"))
                .andExpect(jsonPath("$.data.username").value("admin"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/login - Failure Bad Credentials (HTTP 401)")
    void login_BadCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail("admin");
        request.setPassword("WrongPassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Invalid username or password."));
    }

    @Test
    @DisplayName("POST /api/auth/register - Success (HTTP 201 Created)")
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("new_patient");
        request.setEmail("patient@hospital.com");
        request.setPassword("StrongPass123!");
        request.setFullName("Jane Doe");

        when(authService.register(any(RegisterRequest.class)))
                .thenReturn("User registered successfully. You can now log in.");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("User registered successfully. You can now log in."));
    }

    @Test
    @DisplayName("POST /api/auth/register - Duplicate Username Conflict (HTTP 409)")
    void register_DuplicateUsername_ReturnsConflict() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existing_user");
        request.setEmail("user@hospital.com");
        request.setPassword("StrongPass123!");
        request.setFullName("Jane Doe");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new ConflictException("Username 'existing_user' is already taken"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Username 'existing_user' is already taken"));
    }
}
