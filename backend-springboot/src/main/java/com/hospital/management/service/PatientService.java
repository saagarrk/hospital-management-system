package com.hospital.management.service;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.patient.PatientHistorySummaryResponse;
import com.hospital.management.dto.patient.PatientRequest;
import com.hospital.management.dto.patient.PatientResponse;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import org.springframework.data.domain.Pageable;

public interface PatientService {

    PatientResponse createPatient(PatientRequest request);

    PatientResponse updatePatient(Long id, PatientRequest request);

    PatientResponse getPatientById(Long id);

    PatientResponse getPatientByCode(String code);

    PagedResponse<PatientResponse> searchPatients(
            String query,
            PatientStatus status,
            Gender gender,
            String bloodGroup,
            Pageable pageable
    );

    PatientResponse activatePatient(Long id);

    PatientResponse deactivatePatient(Long id, String reason);

    PatientHistorySummaryResponse getPatientHistorySummary(Long id);

    void deletePatient(Long id);
}
