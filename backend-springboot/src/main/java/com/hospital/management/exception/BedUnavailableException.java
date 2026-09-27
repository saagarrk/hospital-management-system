package com.hospital.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an inpatient admission, ward allocation, or bed transfer
 * fails because the target bed is not in AVAILABLE status (e.g. OCCUPIED, UNDER_MAINTENANCE).
 * Enforces SRS Rule 14 & Rule 15.
 * Maps to HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BedUnavailableException extends ConflictException {

    private final String bedNumber;
    private final String currentStatus;

    public BedUnavailableException(String message) {
        super(message);
        this.bedNumber = null;
        this.currentStatus = null;
    }

    public BedUnavailableException(String bedNumber, String currentStatus) {
        super(String.format("Bed allocation conflict: Bed '%s' is currently '%s'. Only beds in 'AVAILABLE' status can be assigned to admissions.",
                bedNumber, currentStatus));
        this.bedNumber = bedNumber;
        this.currentStatus = currentStatus;
    }

    public String getBedNumber() {
        return bedNumber;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }
}
