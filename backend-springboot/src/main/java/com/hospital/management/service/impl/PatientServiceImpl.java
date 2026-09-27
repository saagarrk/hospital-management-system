package com.hospital.management.service.impl;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.patient.PatientHistorySummaryResponse;
import com.hospital.management.dto.patient.PatientRequest;
import com.hospital.management.dto.patient.PatientResponse;
import com.hospital.management.entity.*;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.DuplicateResourceException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.PatientMapper;
import com.hospital.management.repository.*;
import com.hospital.management.service.PatientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AdmissionRepository admissionRepository;
    private final PatientMapper patientMapper;
    private final com.hospital.management.service.AuditLogService auditLogService;

    @Override
    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
        log.info("Registering new patient: {}", request.getName());

        // Validate uniqueness of mobile number
        if (patientRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("A patient with mobile number " + request.getPhone() + " is already registered.");
        }

        // Validate uniqueness of email if provided
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (patientRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
                throw new DuplicateResourceException("A patient with email address " + request.getEmail() + " is already registered.");
            }
        }

        Patient patient = patientMapper.toEntity(request);

        // Generate enterprise MRN (Medical Record Number): e.g. PT-2026-XXXX or PT-XXXX
        long count = patientRepository.count() + 1;
        String formattedCode = String.format("PT-%04d", count);
        while (patientRepository.existsByPatientCode(formattedCode)) {
            count++;
            formattedCode = String.format("PT-%04d", count);
        }
        patient.setPatientCode(formattedCode);
        patient.setStatus(PatientStatus.ACTIVE);

        // Link with user account if provided
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User account not found with ID: " + request.getUserId()));
            patient.setUser(user);
        }

        Patient saved = patientRepository.save(patient);
        log.info("Patient registered successfully with MRN: {}", saved.getPatientCode());
        auditLogService.logCurrentActor("PATIENT_REGISTERED", "PATIENT", saved.getId(), "Registered patient: " + saved.getName() + " (" + saved.getPatientCode() + ")");
        return patientMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PatientResponse updatePatient(Long id, PatientRequest request) {
        log.info("Updating patient ID: {}", id);

        Patient existing = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        // Validate mobile uniqueness collision with other patients
        if (patientRepository.existsByPhoneAndIdNot(request.getPhone(), id)) {
            throw new DuplicateResourceException("Mobile number " + request.getPhone() + " is already used by another patient.");
        }

        // Validate email uniqueness collision with other patients
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (patientRepository.existsByEmailAndIdNot(request.getEmail().trim().toLowerCase(), id)) {
                throw new DuplicateResourceException("Email " + request.getEmail() + " is already used by another patient.");
            }
        }

        existing.setName(request.getName().trim());
        existing.setDateOfBirth(request.getDateOfBirth());
        existing.setGender(request.getGender());
        existing.setBloodGroup(request.getBloodGroup() != null ? request.getBloodGroup().getLabel() : existing.getBloodGroup());
        if (request.getMaritalStatus() != null) {
            existing.setMaritalStatus(request.getMaritalStatus());
        }
        existing.setOccupation(request.getOccupation());
        existing.setPhone(request.getPhone().trim());
        existing.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        existing.setAddress(request.getAddress());
        existing.setEmergencyContactName(request.getEmergencyContactName().trim());
        existing.setEmergencyContactPhone(request.getEmergencyContactPhone().trim());
        existing.setEmergencyContactRelation(request.getEmergencyContactRelation());
        existing.setMedicalHistory(request.getMedicalHistory());
        existing.setAllergies(request.getAllergies());

        if (request.getUserId() != null && (existing.getUser() == null || !existing.getUser().getId().equals(request.getUserId()))) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
            existing.setUser(user);
        }

        Patient updated = patientRepository.save(existing);
        log.info("Patient ID {} updated successfully", id);
        auditLogService.logCurrentActor("PATIENT_UPDATED", "PATIENT", updated.getId(), "Updated demographics/history for: " + updated.getName());
        return patientMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        // Enforce Role-Based Data Isolation (SRS Rule 9)
        verifyPatientDataAccess(patient);

        return patientMapper.toResponse(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getPatientByCode(String code) {
        Patient patient = patientRepository.findByPatientCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with patient code: " + code));

        verifyPatientDataAccess(patient);

        return patientMapper.toResponse(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PatientResponse> searchPatients(
            String query,
            PatientStatus status,
            Gender gender,
            String bloodGroup,
            Pageable pageable) {

        Page<Patient> page = patientRepository.findWithFilters(query, status, gender, bloodGroup, pageable);

        List<PatientResponse> content = page.getContent().stream()
                .map(patientMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<PatientResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional
    public PatientResponse activatePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        patient.setStatus(PatientStatus.ACTIVE);
        Patient updated = patientRepository.save(patient);
        log.info("Patient ID {} activated successfully", id);
        return patientMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public PatientResponse deactivatePatient(Long id, String reason) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        patient.setStatus(PatientStatus.INACTIVE);
        if (reason != null && !reason.trim().isEmpty()) {
            String history = patient.getMedicalHistory() != null ? patient.getMedicalHistory() : "";
            patient.setMedicalHistory(history + "\n[DEACTIVATION NOTE - " + LocalDate.now() + "]: " + reason.trim());
        }

        Patient updated = patientRepository.save(patient);
        log.info("Patient ID {} deactivated. Reason: {}", id, reason);
        return patientMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientHistorySummaryResponse getPatientHistorySummary(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        verifyPatientDataAccess(patient);

        // Fetch related clinical records
        List<Appointment> appointments = appointmentRepository.findByPatientId(id);
        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByVisitDateDesc(id);
        List<Prescription> prescriptions = prescriptionRepository.findByPatientIdOrderByPrescriptionDateDesc(id);
        List<Admission> admissions = admissionRepository.findByPatientId(id);

        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        // Map recent appointments
        List<PatientHistorySummaryResponse.AppointmentSummaryItem> recentAppts = appointments.stream()
                .limit(5)
                .map(a -> PatientHistorySummaryResponse.AppointmentSummaryItem.builder()
                        .id(a.getId())
                        .date(a.getAppointmentDate())
                        .time(a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "")
                        .doctorName(a.getDoctor() != null ? a.getDoctor().getName() : "Unassigned")
                        .department(a.getDoctor() != null && a.getDoctor().getDepartment() != null ? a.getDoctor().getDepartment().getName() : "General")
                        .reason(a.getReason())
                        .status(a.getStatus() != null ? a.getStatus().name() : "")
                        .build())
                .collect(Collectors.toList());

        // Map recent clinical records
        List<PatientHistorySummaryResponse.MedicalRecordSummaryItem> recentRecords = records.stream()
                .limit(5)
                .map(r -> PatientHistorySummaryResponse.MedicalRecordSummaryItem.builder()
                        .id(r.getId())
                        .visitDate(r.getVisitDate())
                        .doctorName(r.getDoctor() != null ? r.getDoctor().getName() : "Attending Physician")
                        .diagnosis(r.getDiagnosis())
                        .symptoms(r.getSymptoms())
                        .treatment(r.getTreatment())
                        .bloodPressure(r.getBloodPressure())
                        .heartRate(r.getHeartRate())
                        .build())
                .collect(Collectors.toList());

        // Map recent prescriptions
        List<PatientHistorySummaryResponse.PrescriptionSummaryItem> recentRx = prescriptions.stream()
                .limit(5)
                .map(p -> {
                    List<String> medNames = p.getItems() != null
                            ? p.getItems().stream()
                            .map(item -> item.getMedicine() != null ? item.getMedicine().getName() : "Medication")
                            .collect(Collectors.toList())
                            : new ArrayList<>();

                    return PatientHistorySummaryResponse.PrescriptionSummaryItem.builder()
                            .id(p.getId())
                            .date(p.getPrescriptionDate())
                            .doctorName(p.getDoctor() != null ? p.getDoctor().getName() : "Doctor")
                            .medicationCount(p.getItems() != null ? p.getItems().size() : 0)
                            .status(p.getStatus())
                            .medicineNames(medNames)
                            .build();
                })
                .collect(Collectors.toList());

        // Map admissions
        List<PatientHistorySummaryResponse.AdmissionSummaryItem> recentAdm = admissions.stream()
                .limit(5)
                .map(adm -> PatientHistorySummaryResponse.AdmissionSummaryItem.builder()
                        .id(adm.getId())
                        .admissionDate(adm.getAdmissionDate() != null ? adm.getAdmissionDate().toString() : "")
                        .dischargeDate(adm.getDischargeDate() != null ? adm.getDischargeDate().toString() : null)
                        .roomNumber(adm.getBed() != null && adm.getBed().getRoom() != null ? adm.getBed().getRoom().getRoomNumber() : "N/A")
                        .bedNumber(adm.getBed() != null ? adm.getBed().getBedNumber() : "N/A")
                        .attendingDoctor(adm.getDoctor() != null ? adm.getDoctor().getName() : "Attending Doctor")
                        .status(adm.getStatus())
                        .build())
                .collect(Collectors.toList());

        return PatientHistorySummaryResponse.builder()
                .patientId(patient.getId())
                .patientCode(patient.getPatientCode())
                .patientName(patient.getName())
                .age(age)
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .phone(patient.getPhone())
                .email(patient.getEmail())
                .status(patient.getStatus())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .emergencyContactRelation(patient.getEmergencyContactRelation())
                .allergies(patient.getAllergies())
                .chronicConditions(patient.getMedicalHistory())
                .totalAppointments(appointments.size())
                .totalMedicalRecords(records.size())
                .totalPrescriptions(prescriptions.size())
                .totalAdmissions(admissions.size())
                .recentAppointments(recentAppts)
                .recentClinicalRecords(recentRecords)
                .recentPrescriptions(recentRx)
                .recentHospitalAdmissions(recentAdm)
                .build();
    }

    @Override
    @Transactional
    public void deletePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        // Soft delete / archive to preserve historical medical audit compliance
        patient.setStatus(PatientStatus.ARCHIVED);
        patientRepository.save(patient);
        log.info("Patient ID {} archived (soft-deleted)", id);
    }

    /**
     * Enforces SRS Rule 9: Patient protected health records isolation.
     * Authenticated users with ROLE_PATIENT may strictly only access their own patient profile.
     * Medical staff (ADMIN, DOCTOR, NURSE, RECEPTIONIST) have clinical access.
     */
    private void verifyPatientDataAccess(Patient patient) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }

        boolean isPatientRole = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_PATIENT") || a.equals("PATIENT"));

        if (isPatientRole) {
            String currentUsername = auth.getName();
            boolean isOwner = patient.getUser() != null &&
                    currentUsername.equalsIgnoreCase(patient.getUser().getUsername());

            if (!isOwner) {
                log.warn("Access Denied: User '{}' attempted to access patient profile ID: {}", currentUsername, patient.getId());
                throw new UnauthorizedActionException("SRS Rule 9 Security Violation: Patients are strictly restricted to accessing their own medical record.");
            }
        }
    }
}
