package com.hospital.management.service;

import com.hospital.management.dto.admission.*;
import com.hospital.management.dto.common.PagedResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InpatientService {

    // Room Management
    RoomResponse createRoom(RoomRequest request);
    RoomResponse updateRoom(Long roomId, RoomRequest request);
    void deleteRoom(Long roomId);
    List<RoomResponse> getAllRooms();
    RoomResponse getRoomById(Long roomId);

    // Bed Management
    BedResponse createBed(BedRequest request);
    BedResponse updateBed(Long bedId, BedRequest request);
    BedResponse updateBedStatus(Long bedId, BedStatusUpdateRequest request);
    void deleteBed(Long bedId);
    List<BedResponse> getAllBeds(Long roomId, String status);
    BedResponse getBedById(Long bedId);

    // Patient Admission & Assignment
    AdmissionResponse admitPatient(AdmissionRequest request);
    AdmissionResponse reassignDoctor(Long admissionId, DoctorReassignmentRequest request);

    // Bed Transfer & History
    AdmissionResponse transferBed(Long admissionId, Long targetBedId, String reason, String transferredBy);
    List<BedTransferHistoryResponse> getTransferHistory(Long admissionId);

    // Admitted Patients & Discharge
    AdmissionResponse getAdmissionById(Long id);
    List<AdmissionResponse> getActiveAdmissions();
    PagedResponse<AdmissionResponse> getAllAdmissions(String status, Pageable pageable);
    DischargePreparationResponse prepareDischarge(Long admissionId);
    DischargeSummaryResponse dischargePatient(Long admissionId, DischargeRequest request);
}
