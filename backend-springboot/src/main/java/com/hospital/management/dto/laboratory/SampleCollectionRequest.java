package com.hospital.management.dto.laboratory;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SampleCollectionRequest {

    @NotBlank(message = "Sample/Specimen type is required (e.g. WHOLE_BLOOD, SERUM, URINE, SWAB)")
    private String sampleType;

    private String sampleBarcode;

    private String notes;
}
