package com.hospital.management.dto.prescription;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItemDTO {
    private Long id;

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    private String medicineName;
    private String genericName;
    private String category;
    private java.math.BigDecimal unitPrice;

    @NotBlank(message = "Dosage is required (e.g. 500mg)")
    private String dosage;

    @NotBlank(message = "Frequency is required (e.g. TID, BID, OD)")
    private String frequency;

    @NotBlank(message = "Duration is required (e.g. 7 days)")
    private String duration;

    private String instructions;
}
