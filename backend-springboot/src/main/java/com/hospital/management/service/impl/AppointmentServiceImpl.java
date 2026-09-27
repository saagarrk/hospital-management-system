package com.hospital.management.service.impl;

import com.hospital.management.dto.appointment.*;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.entity.Appointment;
import com.hospital.management.entity.Doctor;
import com.hospital.management.entity.Patient;
import com.hospital.management.enums.AppointmentStatus;
import com.hospital.management.enums.PatientStatus;
import com.hospital.management.exception.AppointmentConflictException;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.InvalidStatusTransitionException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.AppointmentMapper;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enterprise Service Implementation for Clinical Appointment Management.
 * Enforces production-grade business rules, state machine transitions,
 * conflict-detection algorithms, and HIPAA patient data isolation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private static final List<AppointmentStatus> ACTIVE_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private static final int DEFAULT_SLOT_DURATION_MINUTES = 30;
    private static final LocalTime DEFAULT_START_TIME = LocalTime.of(9, 0);
    private static final LocalTime DEFAULT_END_TIME = LocalTime.of(17, 0);

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentMapper appointmentMapper;
    private final com.hospital.management.service.AuditLogService auditLogService;

    /**
     * Business Rule 1: A doctor cannot have two appointments at the same time.
     * Business Rule 2: Appointment can only be booked when doctor is available.
     * Business Rule 4: Only authorized roles can perform each operation.
     * Business Rule 5: Patients can only manage/view their permitted appointments.
     * Business Rule 7: Validate patient and doctor existence.
     */
    @Override
    @Transactional
    public AppointmentResponse bookAppointment(AppointmentBookingRequest request) {
        log.info("Processing appointment booking request: Patient ID={}, Doctor ID={}, Date={}, Time={}",
                request.getPatientId(), request.getDoctorId(), request.getAppointmentDate(), request.getAppointmentTime());

        // SRS Rule 7: Validate Patient and Doctor existence
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + request.getDoctorId()));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getPatientId()));

        // Validate active status of Patient
        if (patient.getStatus() == PatientStatus.ARCHIVED || patient.getStatus() == PatientStatus.INACTIVE) {
            throw new BusinessRuleException(
                    "Cannot book appointment for an inactive or archived patient. Current status: " + patient.getStatus(),
                    HttpStatus.BAD_REQUEST
            );
        }

        // SRS Rule 5: Patient isolation - authenticated patients can only book for themselves
        verifyPatientOwnership(patient);

        // SRS Rule 2: Validate temporal constraints & Doctor working schedule
        validateDateTimeConstraints(request.getAppointmentDate(), request.getAppointmentTime());
        validateDoctorAvailability(doctor, request.getAppointmentDate(), request.getAppointmentTime());

        // SRS Rule 1: Conflict-detection algorithm (Doctor cannot have two appointments at the same time)
        boolean hasConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                ACTIVE_STATUSES
        );

        if (hasConflict) {
            log.warn("Conflict detected: Dr. {} already has an active appointment at {} {}",
                    doctor.getName(), request.getAppointmentDate(), request.getAppointmentTime());
            throw new AppointmentConflictException(doctor.getName(), request.getAppointmentDate(), request.getAppointmentTime().toString());
        }

        Appointment appointment = appointmentMapper.toEntity(request, patient, doctor);
        appointment.setStatus(AppointmentStatus.PENDING);

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment booked successfully with ID: {}, Status: {}", saved.getId(), saved.getStatus());
        auditLogService.logCurrentActor("APPOINTMENT_CREATED", "APPOINTMENT", saved.getId(),
                String.format("Booked appointment with Dr. %s for date %s %s", doctor.getName(), saved.getAppointmentDate(), saved.getAppointmentTime()));
        return appointmentMapper.toResponse(saved);
    }

    /**
     * Confirms a PENDING appointment.
     * Rule 4: Clinical staff (RECEPTIONIST, ADMIN, DOCTOR) authorization only.
     * Rule 8: Prevent invalid status transitions.
     */
    @Override
    @Transactional
    public AppointmentResponse confirmAppointment(Long appointmentId, String notes) {
        log.info("Confirming appointment ID: {}", appointmentId);
        verifyStaffOrDoctorRole("Only clinical staff, doctors, or administrators can confirm appointments.");

        Appointment appointment = findAppointmentById(appointmentId);

        // Rule 8: State transition validation (Must be PENDING -> CONFIRMED)
        validateStatusTransition(appointment.getStatus(), AppointmentStatus.CONFIRMED);

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        if (notes != null && !notes.isBlank()) {
            appointment.setNotes(appointment.getNotes() != null
                    ? appointment.getNotes() + "\n[Confirmation Note]: " + notes.trim()
                    : "[Confirmation Note]: " + notes.trim());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment ID: {} successfully confirmed", appointmentId);
        return appointmentMapper.toResponse(updated);
    }

    /**
     * Business Rule 6: Rescheduling must also validate conflicts.
     * Business Rule 2: Doctor must be available at new date and time.
     * Business Rule 3 & 8: Cancelled or Completed appointments cannot be rescheduled.
     * Business Rule 5: Patients can only reschedule their permitted appointments.
     */
    @Override
    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, AppointmentRescheduleRequest request) {
        log.info("Rescheduling appointment ID: {} to Date={}, Time={}",
                appointmentId, request.getNewDate(), request.getNewTime());

        Appointment appointment = findAppointmentById(appointmentId);

        // Rule 5: Patient isolation - patients can only reschedule their own appointments
        verifyPatientOwnership(appointment.getPatient());

        // Rule 3 & 8: Check if current state allows rescheduling
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessRuleException(
                    "Cancelled appointments cannot be rescheduled. Please book a fresh appointment.",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessRuleException(
                    "Completed appointments cannot be rescheduled.",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Rule 2: Validate temporal and schedule constraints for new slot
        validateDateTimeConstraints(request.getNewDate(), request.getNewTime());
        validateDoctorAvailability(appointment.getDoctor(), request.getNewDate(), request.getNewTime());

        // Rule 6: Conflict-detection for rescheduling (excludes current appointment ID)
        boolean hasConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndIdNot(
                appointment.getDoctor().getId(),
                request.getNewDate(),
                request.getNewTime(),
                ACTIVE_STATUSES,
                appointment.getId()
        );

        if (hasConflict) {
            log.warn("Reschedule conflict detected: Dr. {} is already booked at {} {}",
                    appointment.getDoctor().getName(), request.getNewDate(), request.getNewTime());
            throw new AppointmentConflictException(appointment.getDoctor().getName(), request.getNewDate(), request.getNewTime().toString());
        }

        appointment.setAppointmentDate(request.getNewDate());
        appointment.setAppointmentTime(request.getNewTime());

        if (request.getRescheduleReason() != null && !request.getRescheduleReason().isBlank()) {
            String note = "[Rescheduled: " + LocalDate.now() + "]: " + request.getRescheduleReason().trim();
            appointment.setNotes(appointment.getNotes() != null
                    ? appointment.getNotes() + "\n" + note
                    : note);
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            appointment.setNotes(appointment.getNotes() != null
                    ? appointment.getNotes() + "\n" + request.getNotes().trim()
                    : request.getNotes().trim());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment ID: {} successfully rescheduled to {} {}", appointmentId, request.getNewDate(), request.getNewTime());
        auditLogService.logCurrentActor("APPOINTMENT_RESCHEDULED", "APPOINTMENT", updated.getId(),
                String.format("Rescheduled to %s %s with Dr. %s", request.getNewDate(), request.getNewTime(), appointment.getDoctor().getName()));
        return appointmentMapper.toResponse(updated);
    }

    /**
     * Cancels an appointment.
     * Terminal state transition.
     */
    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, String cancellationReason) {
        log.info("Cancelling appointment ID: {}", appointmentId);
        Appointment appointment = findAppointmentById(appointmentId);

        // Rule 5: Ownership verification
        verifyPatientOwnership(appointment.getPatient());

        // Rule 8: Validate transition to CANCELLED
        validateStatusTransition(appointment.getStatus(), AppointmentStatus.CANCELLED);

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(cancellationReason != null && !cancellationReason.isBlank()
                ? cancellationReason.trim()
                : "Cancelled by user or clinical staff");

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment ID: {} successfully marked CANCELLED", appointmentId);
        auditLogService.logCurrentActor("APPOINTMENT_CANCELLED", "APPOINTMENT", updated.getId(),
                String.format("Cancelled appointment: reason='%s'", appointment.getCancellationReason()));
        return appointmentMapper.toResponse(updated);
    }

    /**
     * Business Rule 3: Cancelled appointments cannot become completed.
     * Business Rule 4: Only authorized clinical staff or doctors can complete appointments.
     * Business Rule 8: Prevent invalid status transitions.
     */
    @Override
    @Transactional
    public AppointmentResponse completeAppointment(Long appointmentId, String clinicalNotes) {
        log.info("Completing appointment ID: {}", appointmentId);
        verifyStaffOrDoctorRole("Only attending doctors or clinical staff can mark consultations as completed.");

        Appointment appointment = findAppointmentById(appointmentId);

        // Rule 3: Cancelled appointments cannot become completed
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            log.warn("Rule 3 violation: Attempted to mark CANCELLED appointment {} as COMPLETED", appointmentId);
            throw new InvalidStatusTransitionException(
                    "Rule 3 Violation: Cancelled appointments cannot become completed. Rebooking is strictly required."
            );
        }

        // Rule 8: State transition validation (Must be CONFIRMED -> COMPLETED)
        validateStatusTransition(appointment.getStatus(), AppointmentStatus.COMPLETED);

        appointment.setStatus(AppointmentStatus.COMPLETED);
        if (clinicalNotes != null && !clinicalNotes.isBlank()) {
            appointment.setNotes(appointment.getNotes() != null
                    ? appointment.getNotes() + "\n[Clinical Completion Notes]: " + clinicalNotes.trim()
                    : "[Clinical Completion Notes]: " + clinicalNotes.trim());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment ID: {} successfully completed", appointmentId);
        return appointmentMapper.toResponse(updated);
    }

    /**
     * Feature: Check doctor availability.
     * Calculates time slots across working hours, cross-referencing doctor's schedule and existing active bookings.
     */
    @Override
    @Transactional(readOnly = true)
    public DoctorAvailabilityResponse checkDoctorAvailability(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + doctorId));

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        String dayName = dayOfWeek.name();

        boolean isStatusActive = "ACTIVE".equalsIgnoreCase(doctor.getStatus());
        boolean isWorkingDay = isStatusActive && isDoctorScheduledOnDay(doctor, dayOfWeek);

        LocalTime startTime = doctor.getStartTime() != null ? doctor.getStartTime() : DEFAULT_START_TIME;
        LocalTime endTime = doctor.getEndTime() != null ? doctor.getEndTime() : DEFAULT_END_TIME;

        // Fetch all active appointments for this doctor on the requested date
        List<Appointment> existingActiveAppointments = appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStatusIn(doctorId, date, ACTIVE_STATUSES);

        Map<LocalTime, Appointment> bookedSlotMap = existingActiveAppointments.stream()
                .collect(Collectors.toMap(Appointment::getAppointmentTime, a -> a, (a1, a2) -> a1));

        List<TimeSlotDto> slotDtos = new ArrayList<>();
        LocalTime currentSlot = startTime;
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        while (currentSlot.isBefore(endTime)) {
            boolean isBooked = bookedSlotMap.containsKey(currentSlot);
            boolean isPast = date.isBefore(today) || (date.isEqual(today) && currentSlot.isBefore(now));

            boolean available = isWorkingDay && !isBooked && !isPast;
            String statusMsg;
            Long bookedId = null;

            if (!isStatusActive) {
                statusMsg = "Doctor Unavailable (" + doctor.getStatus() + ")";
            } else if (!isWorkingDay) {
                statusMsg = "Doctor Off Duty (" + dayName + ")";
            } else if (isBooked) {
                statusMsg = "Booked (Active Appointment)";
                bookedId = bookedSlotMap.get(currentSlot).getId();
            } else if (isPast) {
                statusMsg = "Past Slot";
            } else {
                statusMsg = "Available";
            }

            slotDtos.add(TimeSlotDto.builder()
                    .slotTime(currentSlot)
                    .formattedTime(currentSlot.format(timeFormatter))
                    .available(available)
                    .statusMessage(statusMsg)
                    .existingAppointmentId(bookedId)
                    .build());

            currentSlot = currentSlot.plusMinutes(DEFAULT_SLOT_DURATION_MINUTES);
        }

        int availableCount = (int) slotDtos.stream().filter(TimeSlotDto::isAvailable).count();
        int bookedCount = (int) slotDtos.stream().filter(s -> "Booked (Active Appointment)".equals(s.getStatusMessage())).count();

        String statusMessage = !isStatusActive
                ? "Doctor is currently " + doctor.getStatus()
                : (!isWorkingDay
                    ? "Dr. " + doctor.getName() + " is not scheduled on " + dayName + "s."
                    : (availableCount > 0 ? "Slots available for booking." : "All consultation slots are booked for this day."));

        return DoctorAvailabilityResponse.builder()
                .doctorId(doctor.getId())
                .doctorName(doctor.getName())
                .specialization(doctor.getSpecialization())
                .departmentName(doctor.getDepartment() != null ? doctor.getDepartment().getName() : null)
                .checkDate(date)
                .dayOfWeek(dayName)
                .isWorkingDay(isWorkingDay)
                .doctorScheduleDays(doctor.getAvailableDays())
                .startTime(startTime)
                .endTime(endTime)
                .slotDurationMinutes(DEFAULT_SLOT_DURATION_MINUTES)
                .totalSlots(slotDtos.size())
                .availableSlotsCount(availableCount)
                .bookedSlotsCount(bookedCount)
                .slots(slotDtos)
                .statusMessage(statusMessage)
                .build();
    }

    /**
     * Feature: Appointment history.
     * Enforces Rule 5: Patients can only access their own appointment history.
     */
    @Override
    @Transactional(readOnly = true)
    public AppointmentHistoryResponse getPatientAppointmentHistory(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        verifyPatientOwnership(patient);

        List<Appointment> appointments = appointmentRepository
                .findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(patientId);

        List<AppointmentResponse> historyResponses = appointments.stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());

        int total = appointments.size();
        int completed = (int) appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        int cancelled = (int) appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();
        int upcoming = (int) appointments.stream().filter(a -> a.getStatus().isActive()).count();

        return AppointmentHistoryResponse.builder()
                .patientId(patient.getId())
                .patientName(patient.getName())
                .patientCode(patient.getPatientCode())
                .totalAppointments(total)
                .completedAppointments(completed)
                .cancelledAppointments(cancelled)
                .upcomingAppointments(upcoming)
                .history(historyResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = findAppointmentById(id);
        verifyPatientOwnership(appointment.getPatient());
        return appointmentMapper.toResponse(appointment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByPatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        verifyPatientOwnership(patient);

        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(patientId).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Feature: Search/filter appointments with pagination.
     * Enforces Rule 4 and Rule 5.
     */
    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AppointmentResponse> searchAppointments(
            Long doctorId,
            Long patientId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            AppointmentStatus status,
            String search,
            Pageable pageable) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long effectivePatientId = patientId;

        // If authenticated as PATIENT, enforce patient isolation
        if (isPatientRole(auth)) {
            String username = auth.getName();
            Patient authenticatedPatient = patientRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && username.equalsIgnoreCase(p.getUser().getUsername()))
                    .findFirst()
                    .orElse(null);

            if (authenticatedPatient != null) {
                if (patientId != null && !patientId.equals(authenticatedPatient.getId())) {
                    throw new UnauthorizedActionException("Rule 5 Security Violation: Patients cannot search other patient records.");
                }
                effectivePatientId = authenticatedPatient.getId();
            }
        }

        Page<Appointment> page = appointmentRepository.searchAppointments(
                doctorId,
                effectivePatientId,
                date,
                startDate,
                endDate,
                status,
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                pageable
        );

        List<AppointmentResponse> content = page.getContent().stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<AppointmentResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // =========================================================================
    // PRIVATE DOMAIN & BUSINESS RULE VALIDATION HELPERS
    // =========================================================================

    private Appointment findAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
    }

    /**
     * Enforces SRS Rule 2: Appointment can only be booked when doctor is available.
     * Validates doctor active status, weekly day schedule, and clinic hours.
     */
    private void validateDoctorAvailability(Doctor doctor, LocalDate date, LocalTime time) {
        if (!"ACTIVE".equalsIgnoreCase(doctor.getStatus())) {
            throw new BusinessRuleException(
                    "Doctor " + doctor.getName() + " is currently " + doctor.getStatus() + " and cannot accept appointments.",
                    HttpStatus.BAD_REQUEST
            );
        }

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        if (!isDoctorScheduledOnDay(doctor, dayOfWeek)) {
            throw new BusinessRuleException(
                    String.format("Doctor %s is not scheduled on %ss. Regular clinic schedule: %s",
                            doctor.getName(), dayOfWeek.name(), doctor.getAvailableDays()),
                    HttpStatus.BAD_REQUEST
            );
        }

        LocalTime startTime = doctor.getStartTime() != null ? doctor.getStartTime() : DEFAULT_START_TIME;
        LocalTime endTime = doctor.getEndTime() != null ? doctor.getEndTime() : DEFAULT_END_TIME;

        if (time.isBefore(startTime) || time.isAfter(endTime.minusMinutes(DEFAULT_SLOT_DURATION_MINUTES))) {
            throw new BusinessRuleException(
                    String.format("Appointment time %s is outside Doctor %s's consulting hours (%s - %s).",
                            time, doctor.getName(), startTime, endTime),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private boolean isDoctorScheduledOnDay(Doctor doctor, DayOfWeek dayOfWeek) {
        String availableDays = doctor.getAvailableDays();
        if (availableDays == null || availableDays.trim().isEmpty()) {
            return true; // No restrictions specified
        }
        return Arrays.stream(availableDays.split(","))
                .map(String::trim)
                .anyMatch(day -> day.equalsIgnoreCase(dayOfWeek.name()));
    }

    /**
     * Validates that requested date and time are not in the past.
     */
    private void validateDateTimeConstraints(LocalDate date, LocalTime time) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new BusinessRuleException("Appointment date cannot be in the past: " + date, HttpStatus.BAD_REQUEST);
        }
        if (date.isEqual(today) && time.isBefore(LocalTime.now())) {
            throw new BusinessRuleException("Appointment time has already passed for today: " + time, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Enforces SRS Rule 8 & Rule 3: Validates lifecycle state machine.
     */
    private void validateStatusTransition(AppointmentStatus currentStatus, AppointmentStatus targetStatus) {
        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new InvalidStatusTransitionException(currentStatus, targetStatus);
        }
    }

    /**
     * Enforces SRS Rule 5: Patients can only manage/view their permitted appointments.
     */
    private void verifyPatientOwnership(Patient patient) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }

        if (isPatientRole(auth)) {
            String currentUsername = auth.getName();
            boolean isOwner = patient.getUser() != null &&
                    currentUsername.equalsIgnoreCase(patient.getUser().getUsername());

            if (!isOwner) {
                log.warn("Access Denied: Patient user '{}' attempted unauthorized action on patient ID: {}",
                        currentUsername, patient.getId());
                throw new UnauthorizedActionException(
                        "SRS Rule 5 Security Violation: Patients are strictly restricted to managing their own appointments."
                );
            }
        }
    }

    private void verifyStaffOrDoctorRole(String denialMessage) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }

        boolean isStaffOrDoctor = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN") || a.equals("ADMIN") ||
                               a.equals("ROLE_RECEPTIONIST") || a.equals("RECEPTIONIST") ||
                               a.equals("ROLE_DOCTOR") || a.equals("DOCTOR"));

        if (!isStaffOrDoctor) {
            throw new UnauthorizedActionException("Rule 4 Security Violation: " + denialMessage);
        }
    }

    private boolean isPatientRole(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_PATIENT") || a.equals("PATIENT"));
    }
}
