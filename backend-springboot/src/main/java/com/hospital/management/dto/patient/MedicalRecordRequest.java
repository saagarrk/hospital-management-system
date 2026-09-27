package com.hospital.management.dto.patient;

import com.hospital.management.dto.medicalrecord.MedicalRecordCreateRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Legacy compatibility alias for MedicalRecordCreateRequest.
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class MedicalRecordRequest extends MedicalRecordCreateRequest {
}
