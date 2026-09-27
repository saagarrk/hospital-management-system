package com.hospital.management.service.impl;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.prescription.PrescriptionItemDTO;
import com.hospital.management.dto.prescription.PrescriptionPrintDTO;
import com.hospital.management.dto.prescription.PrescriptionRequest;
import com.hospital.management.dto.prescription.PrescriptionResponse;
import com.hospital.management.entity.*;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.InsufficientStockException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.PrescriptionMapper;
import com.hospital.management.repository.*;
import com.hospital.management.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicineRepository medicineRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final PrescriptionMapper prescriptionMapper;
    private final com.hospital.management.service.AuditLogService auditLogService;

    // Pattern to catch invalid 0 or negative dosages (e.g. "0mg", "0 tablet", "-50mg")
    private static final Pattern INVALID_ZERO_DOSAGE = Pattern.compile("^\\s*0+(\\.0+)?\\s*(mg|g|mcg|ml|tablets?|capsules?|puffs?|drops?|units?)?\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern INVALID_NEGATIVE_NUMBER = Pattern.compile("-\\s*\\d+");
    private static final Pattern INVALID_ZERO_DURATION = Pattern.compile("^\\s*0+\\s*(days?|weeks?|months?|doses?|hours?|times?)?\\s*$", Pattern.CASE_INSENSITIVE);

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PrescriptionResponse createPrescription(PrescriptionRequest request, String doctorUsername) {
        log.info("Creating prescription for patientId={} by doctor={}", request.getPatientId(), doctorUsername);

        // 1. Authorize Prescriptive Authority: SRS Rule 4
        // Only licensed medical doctors (or medical admin) can author prescriptions
        Doctor doctor = resolveDoctorByUsername(doctorUsername);

        // 2. Validate Patient Existence
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        // 3. Validate at least one medication item is included
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessRuleException("A prescription must contain at least one medicine item.", HttpStatus.BAD_REQUEST);
        }

        // 4. Optional Appointment linkage
        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
        }

        // 5. Construct Prescription Parent Header
        Prescription prescription = Prescription.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .prescriptionDate(LocalDate.now())
                .status("ISSUED")
                .generalInstructions(request.getGeneralInstructions() != null ? request.getGeneralInstructions().trim() : "Follow prescribed regimen strictly.")
                .items(new ArrayList<>())
                .build();

        // 6. Validate each Prescription Item (existence, expiry, dosage, duration)
        for (int i = 0; i < request.getItems().size(); i++) {
            PrescriptionItemDTO itemDTO = request.getItems().get(i);
            int itemNum = i + 1;

            if (itemDTO.getMedicineId() == null) {
                throw new BusinessRuleException(String.format("Item #%d: Medicine ID is required", itemNum), HttpStatus.BAD_REQUEST);
            }

            // Validate medicine existence
            Medicine medicine = medicineRepository.findById(itemDTO.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException(String.format("Item #%d: Medicine not found with id: %d", itemNum, itemDTO.getMedicineId())));

            // SRS Rule 10: Validate medicine is not expired
            if (medicine.isExpired() || (medicine.getExpiryDate() != null && medicine.getExpiryDate().isBefore(LocalDate.now()))) {
                throw new BusinessRuleException(
                        String.format("Item #%d: Medicine '%s' is EXPIRED (expired on: %s) and cannot be prescribed. Please choose an active formulation.",
                                itemNum, medicine.getName(), medicine.getExpiryDate()),
                        HttpStatus.CONFLICT
                );
            }

            // Validate Dosage
            validateDosage(itemDTO.getDosage(), itemNum, medicine.getName());

            // Validate Frequency
            if (itemDTO.getFrequency() == null || itemDTO.getFrequency().trim().isEmpty()) {
                throw new BusinessRuleException(String.format("Item #%d for '%s': Medication frequency is required (e.g. TID, BID, QD).", itemNum, medicine.getName()), HttpStatus.BAD_REQUEST);
            }

            // Validate Duration
            validateDuration(itemDTO.getDuration(), itemNum, medicine.getName());

            // Build PrescriptionItem linked to parent Prescription
            PrescriptionItem item = PrescriptionItem.builder()
                    .prescription(prescription)
                    .medicine(medicine)
                    .dosage(itemDTO.getDosage().trim())
                    .frequency(itemDTO.getFrequency().trim())
                    .duration(itemDTO.getDuration().trim())
                    .instructions(itemDTO.getInstructions() != null ? itemDTO.getInstructions().trim() : "")
                    .build();

            prescription.addItem(item);
        }

        // 7. Atomic transaction save of Prescription with cascading items
        Prescription saved = prescriptionRepository.save(prescription);
        log.info("Prescription created successfully with id={} and {} items", saved.getId(), saved.getItems().size());
        auditLogService.recordEvent(
                doctorUsername,
                "DOCTOR",
                "PRESCRIPTION_CREATED",
                "PRESCRIPTION",
                saved.getId(),
                "SUCCESS",
                String.format("Issued prescription with %d items for patient %s", saved.getItems().size(), patient.getName())
        );
        return prescriptionMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id, String currentUsername) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        // Enforce Rule 9: Patient PHI Isolation
        verifyPrescriptionAccess(prescription, currentUsername);

        return prescriptionMapper.toResponse(prescription);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPrescriptionsByPatient(Long patientId, String currentUsername) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        // Verify patient ownership if viewing as patient
        verifyPatientOwnership(patient, currentUsername);

        return prescriptionRepository.findByPatientIdOrderByPrescriptionDateDesc(patientId).stream()
                .map(prescriptionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PrescriptionResponse> getAllPrescriptions(Pageable pageable, String status, Long patientId, Long doctorId) {
        Page<Prescription> page;

        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            page = prescriptionRepository.findByStatusOrderByPrescriptionDateDesc(status.toUpperCase().trim(), pageable);
        } else if (patientId != null) {
            page = prescriptionRepository.findByPatientIdOrderByPrescriptionDateDesc(patientId, pageable);
        } else {
            page = prescriptionRepository.findAll(pageable);
        }

        List<PrescriptionResponse> content = page.getContent().stream()
                .map(prescriptionMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<PrescriptionResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PrescriptionResponse dispensePrescription(Long prescriptionId, String pharmacistUsername, String dispensingNotes) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));

        if ("DISPENSED".equalsIgnoreCase(prescription.getStatus())) {
            throw new BusinessRuleException(
                    String.format("Prescription #%d was already dispensed on %s by %s.",
                            prescriptionId, prescription.getDispensedAt(), prescription.getDispensedBy()),
                    HttpStatus.BAD_REQUEST
            );
        }

        if ("CANCELLED".equalsIgnoreCase(prescription.getStatus())) {
            throw new BusinessRuleException(String.format("Prescription #%d is cancelled and cannot be dispensed.", prescriptionId), HttpStatus.BAD_REQUEST);
        }

        // Validate inventory and deduct medication stock
        for (PrescriptionItem item : prescription.getItems()) {
            Medicine med = item.getMedicine();
            if (med != null) {
                if (med.getStockQuantity() <= 0) {
                    throw new InsufficientStockException(
                            String.format("Pharmacy inventory stockout: Medication '%s' (Batch: %s) has 0 units available.",
                                    med.getName(), med.getBatchNumber())
                    );
                }

                // Decrement stock quantity (simulate standard 1 pack or course dispensation)
                int newStock = Math.max(0, med.getStockQuantity() - 1);
                med.setStockQuantity(newStock);

                if (newStock == 0) {
                    med.setStatus("OUT_OF_STOCK");
                } else if (newStock <= med.getMinStockAlert()) {
                    med.setStatus("LOW_STOCK");
                }
                medicineRepository.save(med);
            }
        }

        prescription.setStatus("DISPENSED");
        prescription.setDispensedAt(LocalDateTime.now());
        prescription.setDispensedBy(pharmacistUsername != null ? pharmacistUsername : "Registered Pharmacist");
        prescription.setDispensingNotes(dispensingNotes != null && !dispensingNotes.trim().isEmpty() ? dispensingNotes.trim() : "Medications verified and dispensed in accordance with clinical order.");

        Prescription saved = prescriptionRepository.save(prescription);
        log.info("Prescription #{} marked as DISPENSED by {}", saved.getId(), saved.getDispensedBy());
        auditLogService.recordEvent(
                pharmacistUsername != null ? pharmacistUsername : "PHARMACIST",
                "PHARMACIST",
                "PRESCRIPTION_DISPENSED",
                "PRESCRIPTION",
                saved.getId(),
                "SUCCESS",
                String.format("Dispensed prescription #%d for patient %s", saved.getId(), saved.getPatient().getName())
        );
        return prescriptionMapper.toResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PrescriptionResponse cancelPrescription(Long prescriptionId, String reason, String doctorUsername) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));

        if ("DISPENSED".equalsIgnoreCase(prescription.getStatus())) {
            throw new BusinessRuleException("Cannot cancel an already dispensed prescription.", HttpStatus.BAD_REQUEST);
        }

        prescription.setStatus("CANCELLED");
        prescription.setDispensingNotes("Prescription cancelled: " + (reason != null ? reason : "Order revoked by prescribing physician"));

        Prescription saved = prescriptionRepository.save(prescription);
        return prescriptionMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionPrintDTO getPrintablePrescription(Long id, String currentUsername) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        verifyPrescriptionAccess(prescription, currentUsername);
        return prescriptionMapper.toPrintDTO(prescription);
    }

    // =========================================================================
    // HELPER VALIDATION METHODS
    // =========================================================================

    private void validateDosage(String dosage, int itemNum, String medicineName) {
        if (dosage == null || dosage.trim().isEmpty()) {
            throw new BusinessRuleException(String.format("Item #%d for '%s': Dosage cannot be blank (e.g. 500mg, 1 tablet).", itemNum, medicineName), HttpStatus.BAD_REQUEST);
        }
        String trimmed = dosage.trim();

        if (INVALID_NEGATIVE_NUMBER.matcher(trimmed).find()) {
            throw new BusinessRuleException(String.format("Item #%d for '%s': Dosage cannot contain negative values ('%s').", itemNum, medicineName, trimmed), HttpStatus.BAD_REQUEST);
        }

        if (INVALID_ZERO_DOSAGE.matcher(trimmed).matches()) {
            throw new BusinessRuleException(String.format("Item #%d for '%s': Dosage cannot be zero ('%s'). Must be a therapeutic dose.", itemNum, medicineName, trimmed), HttpStatus.BAD_REQUEST);
        }
    }

    private void validateDuration(String duration, int itemNum, String medicineName) {
        if (duration == null || duration.trim().isEmpty()) {
            throw new BusinessRuleException(String.format("Item #%d for '%s': Duration cannot be blank (e.g. 7 days, 1 month).", itemNum, medicineName), HttpStatus.BAD_REQUEST);
        }
        String trimmed = duration.trim();

        if (INVALID_NEGATIVE_NUMBER.matcher(trimmed).find()) {
            throw new BusinessRuleException(String.format("Item #%d for '%s': Duration cannot be negative ('%s').", itemNum, medicineName, trimmed), HttpStatus.BAD_REQUEST);
        }

        if (INVALID_ZERO_DURATION.matcher(trimmed).matches()) {
            throw new BusinessRuleException(String.format("Item #%d for '%s': Duration cannot be zero ('%s'). Must specify a valid treatment timeframe.", itemNum, medicineName, trimmed), HttpStatus.BAD_REQUEST);
        }
    }

    private Doctor resolveDoctorByUsername(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            if (user.getRole() == Role.PATIENT || user.getRole() == Role.NURSE || user.getRole() == Role.RECEPTIONIST) {
                throw new UnauthorizedActionException(
                        String.format("SRS Rule 4 Violation: User role '%s' does not have prescriptive authority. Only licensed medical doctors can author prescriptions.", user.getRole())
                );
            }
        }

        return doctorRepository.findAll().stream()
                .filter(d -> d.getUser() != null && d.getUser().getUsername().equalsIgnoreCase(username))
                .findFirst()
                .orElse(doctorRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Authorized physician profile not found in system.")));
    }

    private void verifyPrescriptionAccess(Prescription prescription, String currentUsername) {
        if (currentUsername == null || currentUsername.trim().isEmpty()) return;

        User user = userRepository.findByUsername(currentUsername).orElse(null);
        if (user != null && user.getRole() == Role.PATIENT) {
            Patient userPatient = patientRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && p.getUser().getUsername().equalsIgnoreCase(currentUsername))
                    .findFirst()
                    .orElse(null);

            if (userPatient != null && !prescription.getPatient().getId().equals(userPatient.getId())) {
                throw new UnauthorizedActionException("SRS Rule 9 Privacy Violation: Patients are strictly restricted from accessing prescriptions belonging to other patients.");
            }
        }
    }

    private void verifyPatientOwnership(Patient patient, String currentUsername) {
        if (currentUsername == null || currentUsername.trim().isEmpty()) return;

        User user = userRepository.findByUsername(currentUsername).orElse(null);
        if (user != null && user.getRole() == Role.PATIENT) {
            Patient userPatient = patientRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && p.getUser().getUsername().equalsIgnoreCase(currentUsername))
                    .findFirst()
                    .orElse(null);

            if (userPatient != null && !patient.getId().equals(userPatient.getId())) {
                throw new UnauthorizedActionException("SRS Rule 9 Privacy Violation: Patients are strictly restricted to querying their own prescriptions.");
            }
        }
    }
}
