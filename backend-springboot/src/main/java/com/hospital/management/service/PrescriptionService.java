package com.hospital.management.service;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.prescription.PrescriptionPrintDTO;
import com.hospital.management.dto.prescription.PrescriptionRequest;
import com.hospital.management.dto.prescription.PrescriptionResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PrescriptionService {
    PrescriptionResponse createPrescription(PrescriptionRequest request, String doctorUsername);
    PrescriptionResponse getPrescriptionById(Long id, String currentUsername);
    List<PrescriptionResponse> getPrescriptionsByPatient(Long patientId, String currentUsername);
    PagedResponse<PrescriptionResponse> getAllPrescriptions(Pageable pageable, String status, Long patientId, Long doctorId);
    PrescriptionResponse dispensePrescription(Long prescriptionId, String pharmacistUsername, String dispensingNotes);
    PrescriptionResponse cancelPrescription(Long prescriptionId, String reason, String doctorUsername);
    PrescriptionPrintDTO getPrintablePrescription(Long id, String currentUsername);
}
