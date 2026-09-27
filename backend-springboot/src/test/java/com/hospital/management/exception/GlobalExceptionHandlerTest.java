package com.hospital.management.exception;

import com.hospital.management.dto.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GlobalExceptionHandler Centralized Error Translation Tests")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/test-endpoint");
    }

    @Test
    @DisplayName("Should translate ResourceNotFoundException to HTTP 404 NOT_FOUND")
    void handleResourceNotFoundException() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Patient", "id", 999L);
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFound(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getError()).isEqualTo("NOT_FOUND");
        assertThat(response.getBody().getMessage()).contains("Patient not found with id : '999'");
        assertThat(response.getBody().getPath()).isEqualTo("/api/test-endpoint");
    }

    @Test
    @DisplayName("Should translate DuplicateResourceException to HTTP 409 CONFLICT")
    void handleDuplicateResourceException() {
        DuplicateResourceException ex = new DuplicateResourceException("Email already registered");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDuplicateResourceException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getError()).isEqualTo("CONFLICT");
        assertThat(response.getBody().getMessage()).isEqualTo("Email already registered");
    }

    @Test
    @DisplayName("Should translate AppointmentConflictException to HTTP 409 CONFLICT")
    void handleAppointmentConflictException() {
        AppointmentConflictException ex = new AppointmentConflictException("Dr. House", LocalDate.now(), "10:00");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAppointmentConflictException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getMessage()).contains("Dr. House already has an active appointment");
    }

    @Test
    @DisplayName("Should translate BedUnavailableException to HTTP 409 CONFLICT")
    void handleBedUnavailableException() {
        BedUnavailableException ex = new BedUnavailableException("B1", "OCCUPIED");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBedUnavailableException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getMessage()).contains("Bed B1 is currently OCCUPIED");
    }

    @Test
    @DisplayName("Should translate InsufficientStockException to HTTP 400 BAD_REQUEST")
    void handleInsufficientStockException() {
        InsufficientStockException ex = new InsufficientStockException("Amoxicillin", 5, 20);
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleInsufficientStock(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).contains("Available: 5, Requested: 20");
    }

    @Test
    @DisplayName("Should translate BusinessRuleException with custom status (e.g. 402 PAYMENT_REQUIRED)")
    void handleBusinessRuleException_CustomStatus() {
        BusinessRuleException ex = new BusinessRuleException("Unpaid balance remaining", HttpStatus.PAYMENT_REQUIRED);
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBusinessRuleException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYMENT_REQUIRED);
        assertThat(response.getBody().getStatus()).isEqualTo(402);
        assertThat(response.getBody().getMessage()).isEqualTo("Unpaid balance remaining");
    }

    @Test
    @DisplayName("Should translate BadCredentialsException to HTTP 401 UNAUTHORIZED")
    void handleBadCredentials() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleBadCredentials(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().getStatus()).isEqualTo(401);
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid username or password.");
    }

    @Test
    @DisplayName("Should translate AccessDeniedException to HTTP 403 FORBIDDEN")
    void handleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Access is denied");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAccessDenied(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getStatus()).isEqualTo(403);
        assertThat(response.getBody().getMessage()).contains("Access Denied: You do not have the required permissions");
    }

    @Test
    @DisplayName("Should translate MethodArgumentNotValidException into HTTP 400 with field errors map")
    void handleValidationExceptions() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("patientRequest", "phone", "Phone number is required");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        MethodParameter parameter = mock(MethodParameter.class);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationExceptions(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getValidationErrors()).containsEntry("phone", "Phone number is required");
    }

    @Test
    @DisplayName("Should translate unhandled general Exception to HTTP 500 with sanitized message")
    void handleGeneralException_SanitizesMessageToPreventLeakage() {
        Exception ex = new NullPointerException("Internal null pointer in DatabaseConnectionPool");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneralException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getStatus()).isEqualTo(500);
        assertThat(response.getBody().getMessage()).isEqualTo(
                "An unexpected internal server error occurred. Please contact hospital technical support if the issue persists."
        );
        // Ensure sensitive internal stack/class details are never leaked
        assertThat(response.getBody().getMessage()).doesNotContain("NullPointerException");
        assertThat(response.getBody().getMessage()).doesNotContain("DatabaseConnectionPool");
    }
}
