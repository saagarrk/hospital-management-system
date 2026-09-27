package com.hospital.management.dto.pharmacy;

import com.hospital.management.dto.prescription.PrescriptionResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssuePrescriptionResponse {
    private Long prescriptionId;
    private String status;
    private String dispensedBy;
    private LocalDateTime dispensedAt;
    private String dispensingNotes;
    private List<IssuedMedicineItem> issuedItems;
    private PrescriptionResponse prescription;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssuedMedicineItem {
        private Long medicineId;
        private String medicineName;
        private String batchNumber;
        private Integer quantityIssued;
        private Integer remainingStock;
        private String status;
    }
}
