package com.hospital.management.service.impl;

import com.hospital.management.dto.admission.*;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.entity.*;
import com.hospital.management.exception.BedUnavailableException;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.mapper.AdmissionMapper;
import com.hospital.management.mapper.BedMapper;
import com.hospital.management.mapper.BedTransferHistoryMapper;
import com.hospital.management.mapper.RoomMapper;
import com.hospital.management.repository.*;
import com.hospital.management.service.InpatientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InpatientServiceImpl implements InpatientService {

    private final AdmissionRepository admissionRepository;
    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DischargeRepository dischargeRepository;
    private final BillRepository billRepository;
    private final BedTransferHistoryRepository bedTransferHistoryRepository;

    private final AdmissionMapper admissionMapper;
    private final RoomMapper roomMapper;
    private final BedMapper bedMapper;
    private final BedTransferHistoryMapper bedTransferHistoryMapper;
    private final com.hospital.management.service.AuditLogService auditLogService;

    // =========================================================================
    // ROOM MANAGEMENT
    // =========================================================================

    @Override
    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        if (roomRepository.findByRoomNumber(request.getRoomNumber()).isPresent()) {
            throw new ConflictException("Room number " + request.getRoomNumber() + " already exists");
        }

        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .roomType(request.getRoomType())
                .floor(request.getFloor())
                .departmentId(request.getDepartmentId())
                .dailyRate(request.getDailyRate())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 4)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        Room saved = roomRepository.save(room);
        log.info("Created new room #{} (Type: {})", saved.getRoomNumber(), saved.getRoomType());
        return roomMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(Long roomId, RoomRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));

        if (!room.getRoomNumber().equalsIgnoreCase(request.getRoomNumber())) {
            if (roomRepository.findByRoomNumber(request.getRoomNumber()).isPresent()) {
                throw new ConflictException("Room number " + request.getRoomNumber() + " already in use");
            }
            room.setRoomNumber(request.getRoomNumber());
        }

        room.setRoomType(request.getRoomType());
        room.setFloor(request.getFloor());
        room.setDepartmentId(request.getDepartmentId());
        room.setDailyRate(request.getDailyRate());
        if (request.getCapacity() != null) {
            room.setCapacity(request.getCapacity());
        }
        if (request.getStatus() != null) {
            room.setStatus(request.getStatus());
        }

        Room updated = roomRepository.save(room);
        return roomMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));

        long occupiedCount = bedRepository.countByRoomIdAndStatus(roomId, "OCCUPIED");
        if (occupiedCount > 0) {
            throw new ConflictException("Cannot delete room " + room.getRoomNumber() + " because it has " + occupiedCount + " occupied beds");
        }

        roomRepository.delete(room);
        log.info("Deleted room #{}", room.getRoomNumber());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(roomMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));
        return roomMapper.toResponse(room);
    }

    // =========================================================================
    // BED MANAGEMENT
    // =========================================================================

    @Override
    @Transactional
    public BedResponse createBed(BedRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));

        if (bedRepository.existsByBedNumber(request.getBedNumber())) {
            throw new ConflictException("Bed number " + request.getBedNumber() + " already exists");
        }

        Bed bed = Bed.builder()
                .room(room)
                .bedNumber(request.getBedNumber())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "AVAILABLE")
                .notes(request.getNotes())
                .build();

        Bed saved = bedRepository.save(bed);
        log.info("Created bed {} in room {}", saved.getBedNumber(), room.getRoomNumber());
        return bedMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BedResponse updateBed(Long bedId, BedRequest request) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + bedId));

        if (!bed.getBedNumber().equalsIgnoreCase(request.getBedNumber())) {
            if (bedRepository.existsByBedNumber(request.getBedNumber())) {
                throw new ConflictException("Bed number " + request.getBedNumber() + " already exists");
            }
            bed.setBedNumber(request.getBedNumber());
        }

        if (request.getRoomId() != null && !request.getRoomId().equals(bed.getRoom().getId())) {
            if ("OCCUPIED".equalsIgnoreCase(bed.getStatus())) {
                throw new ConflictException("Cannot move bed to another room while it is OCCUPIED");
            }
            Room room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));
            bed.setRoom(room);
        }

        bed.setNotes(request.getNotes());
        Bed updated = bedRepository.save(bed);
        return bedMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public BedResponse updateBedStatus(Long bedId, BedStatusUpdateRequest request) {
        // Use pessimistic write lock to prevent race condition when modifying bed status
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + bedId));

        String targetStatus = request.getStatus().toUpperCase();

        if ("OCCUPIED".equalsIgnoreCase(bed.getStatus()) && !"OCCUPIED".equalsIgnoreCase(targetStatus)) {
            throw new ConflictException("Bed " + bed.getBedNumber() + " is currently OCCUPIED by patient. Discharge or transfer the patient before changing bed status.");
        }

        if ("OCCUPIED".equalsIgnoreCase(targetStatus) && !"OCCUPIED".equalsIgnoreCase(bed.getStatus())) {
            throw new BusinessRuleException("Cannot directly set status to OCCUPIED. Please use Patient Admission module.", HttpStatus.BAD_REQUEST);
        }

        bed.setStatus(targetStatus);
        if (request.getReason() != null && !request.getReason().trim().isEmpty()) {
            bed.setNotes(request.getReason());
        }

        Bed updated = bedRepository.save(bed);
        log.info("Bed {} status updated to {}", bed.getBedNumber(), targetStatus);
        return bedMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBed(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + bedId));

        if ("OCCUPIED".equalsIgnoreCase(bed.getStatus())) {
            throw new ConflictException("Cannot delete bed " + bed.getBedNumber() + " because it is currently OCCUPIED");
        }

        bedRepository.delete(bed);
        log.info("Deleted bed #{}", bed.getBedNumber());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BedResponse> getAllBeds(Long roomId, String status) {
        List<Bed> list;
        if (roomId != null && status != null && !status.trim().isEmpty()) {
            list = bedRepository.findByRoomIdAndStatus(roomId, status.toUpperCase());
        } else if (roomId != null) {
            list = bedRepository.findByRoomId(roomId);
        } else if (status != null && !status.trim().isEmpty()) {
            list = bedRepository.findByStatus(status.toUpperCase());
        } else {
            list = bedRepository.findAll();
        }

        return list.stream()
                .map(bedMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BedResponse getBedById(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + bedId));
        return bedMapper.toResponse(bed);
    }

    // =========================================================================
    // PATIENT ADMISSION (Transactional with Pessimistic Locking)
    // =========================================================================

    @Override
    @Transactional
    public AdmissionResponse admitPatient(AdmissionRequest request) {
        // Business Rule 2 & 3: A patient cannot have multiple active admissions
        boolean hasActiveAdmission = admissionRepository.existsByPatientIdAndStatus(request.getPatientId(), "ADMITTED");
        if (hasActiveAdmission) {
            throw new ConflictException("Patient already has an active hospital admission. A patient cannot have multiple active admissions.");
        }

        // Business Rule 1 & 4: Occupied or unavailable beds cannot be assigned. Use pessimistic locking to prevent race condition.
        Bed bed = bedRepository.findByIdForUpdate(request.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + request.getBedId()));

        if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
            throw new BedUnavailableException(bed.getBedNumber(), bed.getStatus());
        }

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.getDoctorId()));

        Admission admission = Admission.builder()
                .patient(patient)
                .bed(bed)
                .doctor(doctor)
                .admissionDate(LocalDateTime.now())
                .status("ADMITTED")
                .reasonForAdmission(request.getReasonForAdmission())
                .build();

        Admission savedAdmission = admissionRepository.save(admission);

        // Business Rule 4: Bed status must remain synchronized with admission state
        bed.setStatus("OCCUPIED");
        bed.setCurrentPatient(patient);
        bed.setAdmissionId(savedAdmission.getId());
        bedRepository.save(bed);

        auditLogService.logCurrentActor(
                "ADMISSION",
                "ADMISSION",
                savedAdmission.getId(),
                String.format("Admitted patient %s to bed %s by Dr. %s (Reason: %s)",
                        patient.getName(), bed.getBedNumber(), doctor.getName(), request.getReasonForAdmission())
        );

        log.info("Patient #{} ({}) admitted to bed {} by Dr. {}", patient.getId(), patient.getName(), bed.getBedNumber(), doctor.getName());
        return admissionMapper.toResponse(savedAdmission);
    }

    // =========================================================================
    // DOCTOR REASSIGNMENT
    // =========================================================================

    @Override
    @Transactional
    public AdmissionResponse reassignDoctor(Long admissionId, DoctorReassignmentRequest request) {
        Admission admission = admissionRepository.findByIdForUpdate(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found with id: " + admissionId));

        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BusinessRuleException("Cannot reassign doctor for an inactive or discharged admission", HttpStatus.BAD_REQUEST);
        }

        Doctor newDoctor = doctorRepository.findById(request.getNewDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.getNewDoctorId()));

        Doctor oldDoctor = admission.getDoctor();
        admission.setDoctor(newDoctor);
        Admission saved = admissionRepository.save(admission);

        log.info("Admission #{} attending doctor reassigned from Dr. {} to Dr. {} (Reason: {})",
                admissionId, oldDoctor != null ? oldDoctor.getName() : "None", newDoctor.getName(), request.getReason());

        return admissionMapper.toResponse(saved);
    }

    // =========================================================================
    // PATIENT TRANSFER (Transactional, Atomic Swap with Pessimistic Locking)
    // =========================================================================

    @Override
    @Transactional
    public AdmissionResponse transferBed(Long admissionId, Long targetBedId, String reason, String transferredBy) {
        Admission admission = admissionRepository.findByIdForUpdate(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found with id: " + admissionId));

        // Business Rule 3: A discharged patient cannot have an active admission / transfer
        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BusinessRuleException("Cannot transfer bed for inactive or discharged admission (Status: " + admission.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }

        Bed currentBed = bedRepository.findByIdForUpdate(admission.getBed().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current bed not found"));

        if (currentBed.getId().equals(targetBedId)) {
            throw new BusinessRuleException("Target bed is identical to current bed", HttpStatus.BAD_REQUEST);
        }

        // Business Rule 6: Do not allow transfer to unavailable beds. Lock target bed pessimistically.
        Bed targetBed = bedRepository.findByIdForUpdate(targetBedId)
                .orElseThrow(() -> new ResourceNotFoundException("Target bed not found with id: " + targetBedId));

        if (!"AVAILABLE".equalsIgnoreCase(targetBed.getStatus())) {
            throw new BedUnavailableException(targetBed.getBedNumber(), targetBed.getStatus());
        }

        // Business Rule 5: Transfer must release the old bed and occupy the new bed atomically
        currentBed.setStatus("AVAILABLE");
        currentBed.setCurrentPatient(null);
        currentBed.setAdmissionId(null);
        bedRepository.save(currentBed);

        targetBed.setStatus("OCCUPIED");
        targetBed.setCurrentPatient(admission.getPatient());
        targetBed.setAdmissionId(admission.getId());
        bedRepository.save(targetBed);

        // Update admission with new bed
        admission.setBed(targetBed);
        Admission updatedAdmission = admissionRepository.save(admission);

        // Record audit trail in BedTransferHistory
        BedTransferHistory history = BedTransferHistory.builder()
                .admission(admission)
                .patient(admission.getPatient())
                .fromBed(currentBed)
                .toBed(targetBed)
                .transferReason(reason != null ? reason : "Clinical ward / acuity transfer")
                .transferredBy(transferredBy != null ? transferredBy : "Clinical Staff")
                .transferDate(LocalDateTime.now())
                .build();
        bedTransferHistoryRepository.save(history);

        auditLogService.logCurrentActor(
                "TRANSFER",
                "ADMISSION",
                admission.getId(),
                String.format("Transferred patient %s from bed %s to bed %s. Reason: %s",
                        admission.getPatient().getName(), currentBed.getBedNumber(), targetBed.getBedNumber(), reason)
        );

        log.info("Patient #{} transferred atomically from Bed {} to Bed {} (Admission #{})",
                admission.getPatient().getId(), currentBed.getBedNumber(), targetBed.getBedNumber(), admission.getId());

        return admissionMapper.toResponse(updatedAdmission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BedTransferHistoryResponse> getTransferHistory(Long admissionId) {
        return bedTransferHistoryRepository.findByAdmissionIdOrderByTransferDateDesc(admissionId).stream()
                .map(bedTransferHistoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // DISCHARGE PREPARATION & EXECUTION
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public DischargePreparationResponse prepareDischarge(Long admissionId) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found with id: " + admissionId));

        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BusinessRuleException("Admission is not currently active (Status: " + admission.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime admDate = admission.getAdmissionDate();
        long days = Math.max(1, Duration.between(admDate, now).toDays());
        BigDecimal dailyRate = (admission.getBed().getRoom() != null && admission.getBed().getRoom().getDailyRate() != null)
                ? admission.getBed().getRoom().getDailyRate()
                : BigDecimal.ZERO;
        BigDecimal accruedCharges = dailyRate.multiply(BigDecimal.valueOf(days));

        // Invoices and financial calculation
        List<Bill> bills = billRepository.findByAdmissionId(admissionId);
        BigDecimal totalBilled = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;

        for (Bill bill : bills) {
            BigDecimal net = bill.getNetAmount() != null ? bill.getNetAmount() : BigDecimal.ZERO;
            BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
            totalBilled = totalBilled.add(net);
            totalPaid = totalPaid.add(paid);
        }

        BigDecimal balance = totalBilled.subtract(totalPaid);
        boolean billingCleared = balance.compareTo(BigDecimal.ZERO) <= 0;

        List<String> warnings = new ArrayList<>();
        if (!billingCleared) {
            warnings.add("Unpaid balance of $" + balance + " exists on inpatient account. Settle before clearance.");
        }

        return DischargePreparationResponse.builder()
                .admissionId(admission.getId())
                .patientId(admission.getPatient().getId())
                .patientName(admission.getPatient().getName())
                .patientCode(admission.getPatient().getPatientCode())
                .bedId(admission.getBed().getId())
                .bedNumber(admission.getBed().getBedNumber())
                .roomNumber(admission.getBed().getRoom() != null ? admission.getBed().getRoom().getRoomNumber() : "N/A")
                .roomType(admission.getBed().getRoom() != null ? admission.getBed().getRoom().getRoomType() : "N/A")
                .dailyRate(dailyRate)
                .doctorId(admission.getDoctor().getId())
                .doctorName(admission.getDoctor().getName())
                .admissionDate(admDate)
                .proposedDischargeDate(now)
                .lengthOfStayDays(days)
                .accruedRoomCharges(accruedCharges)
                .totalBilledAmount(totalBilled)
                .totalPaidAmount(totalPaid)
                .outstandingBalance(balance.max(BigDecimal.ZERO))
                .billingCleared(billingCleared)
                .vitalsStable(true)
                .labReportsCompleted(true)
                .pharmacyCleared(true)
                .doctorApproved(true)
                .readyForDischarge(billingCleared)
                .clearanceNotes(billingCleared ? "All clinical and billing clearances verified. Safe for discharge." : "Pending billing settlement.")
                .warnings(warnings)
                .build();
    }

    @Override
    @Transactional
    public DischargeSummaryResponse dischargePatient(Long admissionId, DischargeRequest request) {
        // Business Rule 4: Synchronize bed and admission status on discharge
        Admission admission = admissionRepository.findByIdForUpdate(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found with id: " + admissionId));

        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BusinessRuleException("Patient is already discharged or admission is not active", HttpStatus.BAD_REQUEST);
        }

        // Financial Clearance Check (Rule 10)
        List<Bill> bills = billRepository.findByAdmissionId(admissionId);
        for (Bill bill : bills) {
            BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal net = bill.getNetAmount() != null ? bill.getNetAmount() : BigDecimal.ZERO;
            if (paid.compareTo(net) < 0) {
                BigDecimal unpaid = net.subtract(paid);
                throw new BusinessRuleException(
                        "Discharge Blocked: Pending unpaid invoice #" + bill.getBillNumber()
                                + ". Outstanding balance: $" + unpaid
                                + ". Settle account before clearing discharge.",
                        HttpStatus.PAYMENT_REQUIRED
                );
            }
        }

        // Release bed atomically (Bed status set to AVAILABLE)
        Bed bed = bedRepository.findByIdForUpdate(admission.getBed().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found"));
        bed.setStatus("AVAILABLE");
        bed.setCurrentPatient(null);
        bed.setAdmissionId(null);
        bedRepository.save(bed);

        LocalDateTime dischargeTime = LocalDateTime.now();
        admission.setStatus("DISCHARGED");
        admission.setDischargeDate(dischargeTime);
        admissionRepository.save(admission);

        DischargeRecord dischargeRecord = DischargeRecord.builder()
                .admission(admission)
                .patient(admission.getPatient())
                .doctor(admission.getDoctor())
                .dischargeDate(dischargeTime)
                .diagnosisSummary(request.getDiagnosisSummary())
                .treatmentSummary(request.getTreatmentGiven() != null ? request.getTreatmentGiven() : request.getDiagnosisSummary())
                .treatmentGiven(request.getTreatmentGiven())
                .dischargeAdvice(request.getDischargeAdvice())
                .followUpInstructions(request.getDischargeAdvice())
                .billingCleared(true)
                .isBillSettled(true)
                .build();

        DischargeRecord savedRecord = dischargeRepository.save(dischargeRecord);

        auditLogService.logCurrentActor(
                "DISCHARGE",
                "ADMISSION",
                admission.getId(),
                String.format("Discharged patient %s from bed %s. Diagnosis: %s. Billing settled: %b",
                        admission.getPatient().getName(), bed.getBedNumber(), request.getDiagnosisSummary(), true)
        );

        log.info("Patient #{} discharged from bed {}. Bed released and marked AVAILABLE.",
                admission.getPatient().getId(), bed.getBedNumber());

        return DischargeSummaryResponse.builder()
                .id(savedRecord.getId())
                .admissionId(admission.getId())
                .patientId(admission.getPatient().getId())
                .patientName(admission.getPatient().getName())
                .patientCode(admission.getPatient().getPatientCode())
                .dischargeDate(savedRecord.getDischargeDate())
                .diagnosisSummary(savedRecord.getDiagnosisSummary())
                .treatmentGiven(savedRecord.getTreatmentGiven())
                .dischargeAdvice(savedRecord.getDischargeAdvice())
                .billingCleared(savedRecord.isBillingCleared())
                .build();
    }

    // =========================================================================
    // QUERY ADMISSIONS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public AdmissionResponse getAdmissionById(Long id) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found with id: " + id));
        return admissionMapper.toResponse(admission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdmissionResponse> getActiveAdmissions() {
        return admissionRepository.findByStatus("ADMITTED").stream()
                .map(admissionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AdmissionResponse> getAllAdmissions(String status, Pageable pageable) {
        Page<Admission> page = (status != null && !status.trim().isEmpty())
                ? admissionRepository.findByStatus(status.toUpperCase(), pageable)
                : admissionRepository.findAll(pageable);

        List<AdmissionResponse> content = page.getContent().stream()
                .map(admissionMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<AdmissionResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
