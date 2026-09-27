package com.hospital.management.exception;

import com.hospital.management.enums.AppointmentStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an illegal status lifecycle transition is attempted.
 * Enforces SRS Rule 3 & Rule 8 (e.g. attempting to mark a CANCELLED appointment as COMPLETED).
 * Maps to HTTP 400 Bad Request.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidStatusTransitionException extends BusinessRuleException {

    public InvalidStatusTransitionException(AppointmentStatus currentStatus, AppointmentStatus attemptedStatus) {
        super(String.format("Invalid status transition: Cannot transition appointment from %s to %s. Allowed transitions from %s: %s",
                currentStatus,
                attemptedStatus,
                currentStatus,
                (currentStatus != null && currentStatus.getAllowedNextStatuses() != null && currentStatus.getAllowedNextStatuses().isEmpty())
                        ? "None (Terminal State)"
                        : (currentStatus != null ? currentStatus.getAllowedNextStatuses() : "Unknown")),
                HttpStatus.BAD_REQUEST);
    }

    public InvalidStatusTransitionException(String entityType, String currentStatus, String targetStatus) {
        super(String.format("Invalid status transition: Cannot transition %s from '%s' to '%s'. This lifecycle step is disallowed.",
                entityType, currentStatus, targetStatus), HttpStatus.BAD_REQUEST);
    }

    public InvalidStatusTransitionException(String customMessage) {
        super(customMessage, HttpStatus.BAD_REQUEST);
    }
}
