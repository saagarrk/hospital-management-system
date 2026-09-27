package com.hospital.management.enums;

public enum LabTestStatus {
    ORDERED,           // Initial requisition created by Doctor / Staff
    ASSIGNED,          // Technician assigned to process test
    SAMPLE_COLLECTED,  // Specimen collected from patient with barcode/type
    PROCESSING,        // Under analysis in laboratory analyzer
    IN_PROGRESS,       // Alias for PROCESSING
    RESULT_ENTERED,    // Test findings recorded by Lab Technician
    COMPLETED,         // Formal diagnostic lab report verified & generated
    CANCELLED;         // Order revoked with audit justification

    /**
     * Validates realistic hospital laboratory state transitions:
     * ORDERED -> ASSIGNED -> SAMPLE_COLLECTED -> PROCESSING -> RESULT_ENTERED -> COMPLETED
     */
    public boolean canTransitionTo(LabTestStatus target) {
        if (this == target) return true;
        switch (this) {
            case ORDERED:
                return target == ASSIGNED || target == SAMPLE_COLLECTED || target == CANCELLED;
            case ASSIGNED:
                return target == SAMPLE_COLLECTED || target == CANCELLED;
            case SAMPLE_COLLECTED:
                return target == PROCESSING || target == IN_PROGRESS || target == CANCELLED;
            case PROCESSING:
            case IN_PROGRESS:
                return target == RESULT_ENTERED || target == COMPLETED || target == CANCELLED;
            case RESULT_ENTERED:
                return target == COMPLETED || target == CANCELLED;
            case COMPLETED:
            case CANCELLED:
                return false; // Terminal states cannot transition
            default:
                return false;
        }
    }
}
