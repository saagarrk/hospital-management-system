package com.hospital.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an authenticated user attempts to access or modify data
 * outside their permitted scope (e.g. patient attempting to view another patient's medical chart,
 * nurse attempting to alter a physician diagnosis, or pharmacist modifying prescription dosage).
 * Enforces SRS Rule 4, Rule 5, & Rule 9.
 * Maps to HTTP 403 Forbidden.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class UnauthorizedAccessException extends RuntimeException {

    public UnauthorizedAccessException(String message) {
        super(message);
    }

    public UnauthorizedAccessException(String message, Throwable cause) {
        super(message, cause);
    }
}
