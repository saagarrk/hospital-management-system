package com.hospital.management.dto.pharmacy;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssuePrescriptionRequest {

    @NotNull(message = "Prescription ID is required")
    private Long prescriptionId;

    /**
     * Optional custom items; if null or empty, the system automatically resolves all items in the prescription
     */
    private List<ItemToIssue> items;

    private String dispensingNotes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemToIssue {
        private Long medicineId;
        private Integer quantity;
        private String batchNumber;
    }
}
