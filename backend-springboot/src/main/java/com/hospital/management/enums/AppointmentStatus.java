package com.hospital.management.enums;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * Production Lifecycle Statuses for MedPulse Clinical Appointments:
 * - PENDING: Initial state upon patient or staff booking request awaiting confirmation.
 * - CONFIRMED: Physician or clinical staff accepted/verified the booking slot.
 * - COMPLETED: Patient attended consultation and clinical care was rendered.
 * - CANCELLED: Terminated prior to completion by patient or staff. (Terminal state)
 */
public enum AppointmentStatus {
    PENDING,
    CONFIRMED,
    COMPLETED,
    CANCELLED;

    /**
     * Enforces SRS State Machine & Rule 8 / Rule 3:
     * - PENDING can transition to CONFIRMED or CANCELLED.
     * - CONFIRMED can transition to COMPLETED or CANCELLED.
     * - COMPLETED is a terminal state. No transitions allowed.
     * - CANCELLED is a terminal state. Cancelled appointments cannot become completed (Rule 3).
     */
    public boolean canTransitionTo(AppointmentStatus targetStatus) {
        if (this == targetStatus) {
            return true; // Idempotent same-state
        }
        return switch (this) {
            case PENDING -> targetStatus == CONFIRMED || targetStatus == CANCELLED;
            case CONFIRMED -> targetStatus == COMPLETED || targetStatus == CANCELLED;
            case COMPLETED, CANCELLED -> false; // Terminal states
        };
    }

    public Set<AppointmentStatus> getAllowedNextStatuses() {
        return switch (this) {
            case PENDING -> EnumSet.of(CONFIRMED, CANCELLED);
            case CONFIRMED -> EnumSet.of(COMPLETED, CANCELLED);
            case COMPLETED, CANCELLED -> Collections.emptySet();
        };
    }

    public boolean isActive() {
        return this == PENDING || this == CONFIRMED;
    }
}
