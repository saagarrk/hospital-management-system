package com.hospital.management.service;

import com.hospital.management.dto.appointment.AppointmentBookingRequest;
import com.hospital.management.dto.appointment.AppointmentRescheduleRequest;
import com.hospital.management.dto.appointment.AppointmentResponse;
import com.hospital.management.entity.Appointment;
import com.hospital.management.entity.Doctor;
import com.hospital.management.entity.Patient;
import com.hospital.management.entity.User;
import com.hospital.management.enums.AppointmentStatus;
import com.hospital.management.enums.PatientStatus;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.AppointmentConflictException;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.InvalidStatusTransitionException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.AppointmentMapper;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService Business Logic & State Machine Tests")
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AppointmentMapper appointmentMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private Doctor sampleDoctor;
    private Patient samplePatient;
    private LocalDate futureDate;
    private LocalTime slotTime;

    @BeforeEach
    void setUp() {
        // Find next Monday to match doctor schedule
        futureDate = LocalDate.now().plusWeeks(1);
        while (futureDate.getDayOfWeek() != DayOfWeek.MONDAY) {
            futureDate = futureDate.plusDays(1);
        }
        slotTime = LocalTime.of(10, 0);

        sampleDoctor = Doctor.builder()
                .id(1L)
                .name("Dr. House")
                .email("house@hospital.com")
                .phone("555-4321")
                .specialization("Diagnostic Medicine")
                .consultationFee(BigDecimal.valueOf(150.00))
                .availableDays("MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY")
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .build();

        User patientUser = User.builder()
                .id(2L)
                .username("patient_user")
                .role(Role.PATIENT)
                .build();

        samplePatient = Patient.builder()
                .id(10L)
                .name("Alice Smith")
                .patientCode("PT-0001")
                .status(PatientStatus.ACTIVE)
                .user(patientUser)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthentication(String username, String role) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn(username);
        doReturn(List.of(new SimpleGrantedAuthority(role))).when(auth).getAuthorities();

        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);
    }

    @Nested
    @DisplayName("Appointment Booking & Conflict Detection Tests")
    class BookingTests {

        @Test
        @DisplayName("Should successfully book appointment when doctor is available and slot is open")
        void bookAppointment_Success() {
            // Arrange
            AppointmentBookingRequest request = new AppointmentBookingRequest();
            request.setDoctorId(1L);
            request.setPatientId(10L);
            request.setAppointmentDate(futureDate);
            request.setAppointmentTime(slotTime);
            request.setReason("General Checkup");

            when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
            when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));
            when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                    eq(1L), eq(futureDate), eq(slotTime), any()
            )).thenReturn(false);

            Appointment entity = Appointment.builder().id(100L).status(AppointmentStatus.PENDING).build();
            when(appointmentMapper.toEntity(request, samplePatient, sampleDoctor)).thenReturn(entity);
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(entity);
            when(appointmentMapper.toResponse(entity)).thenReturn(
                    AppointmentResponse.builder().id(100L).status(AppointmentStatus.PENDING).build()
            );

            // Act
            AppointmentResponse response = appointmentService.bookAppointment(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(AppointmentStatus.PENDING);
            verify(appointmentRepository).save(entity);
            verify(auditLogService).logCurrentActor(eq("APPOINTMENT_CREATED"), eq("APPOINTMENT"), eq(100L), any());
        }

        @Test
        @DisplayName("Should reject booking and throw AppointmentConflictException when doctor already has an active appointment at that time")
        void bookAppointment_DoctorConflict_ThrowsAppointmentConflictException() {
            // Arrange
            AppointmentBookingRequest request = new AppointmentBookingRequest();
            request.setDoctorId(1L);
            request.setPatientId(10L);
            request.setAppointmentDate(futureDate);
            request.setAppointmentTime(slotTime);

            when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
            when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));
            when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                    eq(1L), eq(futureDate), eq(slotTime), any()
            )).thenReturn(true); // Active conflict!

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.bookAppointment(request))
                    .isInstanceOf(AppointmentConflictException.class)
                    .hasMessageContaining("already has an active appointment");

            verify(appointmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject booking for inactive or archived patients")
        void bookAppointment_InactivePatient_ThrowsBusinessRuleException() {
            // Arrange
            samplePatient.setStatus(PatientStatus.ARCHIVED);

            AppointmentBookingRequest request = new AppointmentBookingRequest();
            request.setDoctorId(1L);
            request.setPatientId(10L);
            request.setAppointmentDate(futureDate);
            request.setAppointmentTime(slotTime);

            when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
            when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.bookAppointment(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Cannot book appointment for an inactive or archived patient");
        }

        @Test
        @DisplayName("Should reject booking on days doctor is not in clinic")
        void bookAppointment_DoctorNotScheduledOnDay_ThrowsBusinessRuleException() {
            // Arrange: Sunday is not in sampleDoctor available days
            LocalDate sunday = futureDate;
            while (sunday.getDayOfWeek() != DayOfWeek.SUNDAY) {
                sunday = sunday.plusDays(1);
            }

            AppointmentBookingRequest request = new AppointmentBookingRequest();
            request.setDoctorId(1L);
            request.setPatientId(10L);
            request.setAppointmentDate(sunday);
            request.setAppointmentTime(slotTime);

            when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
            when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.bookAppointment(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("is not scheduled on SUNDAY");
        }

        @Test
        @DisplayName("Should reject booking outside doctor working hours")
        void bookAppointment_OutsideDoctorHours_ThrowsBusinessRuleException() {
            // Arrange: 7:00 AM is before 9:00 AM start time
            AppointmentBookingRequest request = new AppointmentBookingRequest();
            request.setDoctorId(1L);
            request.setPatientId(10L);
            request.setAppointmentDate(futureDate);
            request.setAppointmentTime(LocalTime.of(7, 0));

            when(doctorRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
            when(patientRepository.findById(10L)).thenReturn(Optional.of(samplePatient));

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.bookAppointment(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("outside Doctor Dr. House's consulting hours");
        }
    }

    @Nested
    @DisplayName("Status Lifecycle State Machine Tests")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition from PENDING to CONFIRMED when confirmed by receptionist or staff")
        void confirmAppointment_Success() {
            // Arrange: Staff role
            mockAuthentication("receptionist_mary", "ROLE_RECEPTIONIST");

            Appointment pending = Appointment.builder()
                    .id(100L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .status(AppointmentStatus.PENDING)
                    .build();

            when(appointmentRepository.findById(100L)).thenReturn(Optional.of(pending));
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(pending);
            when(appointmentMapper.toResponse(pending)).thenReturn(
                    AppointmentResponse.builder().id(100L).status(AppointmentStatus.CONFIRMED).build()
            );

            // Act
            AppointmentResponse result = appointmentService.confirmAppointment(100L, "Patient called to confirm");

            // Assert
            assertThat(pending.getStatus()).isEqualTo(AppointmentStatus.CONFIRMED);
            assertThat(pending.getNotes()).contains("[Confirmation Note]: Patient called to confirm");
            verify(appointmentRepository).save(pending);
        }

        @Test
        @DisplayName("Should reject invalid state transition: CANCELLED -> CONFIRMED")
        void confirmAppointment_FromCancelled_ThrowsInvalidStatusTransitionException() {
            // Arrange
            mockAuthentication("admin_user", "ROLE_ADMIN");

            Appointment cancelled = Appointment.builder()
                    .id(100L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .status(AppointmentStatus.CANCELLED)
                    .build();

            when(appointmentRepository.findById(100L)).thenReturn(Optional.of(cancelled));

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.confirmAppointment(100L, "Notes"))
                    .isInstanceOf(InvalidStatusTransitionException.class);

            verify(appointmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should cancel PENDING or CONFIRMED appointment and record cancellation reason")
        void cancelAppointment_Success() {
            // Arrange
            Appointment confirmed = Appointment.builder()
                    .id(100L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .status(AppointmentStatus.CONFIRMED)
                    .build();

            when(appointmentRepository.findById(100L)).thenReturn(Optional.of(confirmed));
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(confirmed);
            when(appointmentMapper.toResponse(confirmed)).thenReturn(
                    AppointmentResponse.builder().id(100L).status(AppointmentStatus.CANCELLED).build()
            );

            // Act
            AppointmentResponse response = appointmentService.cancelAppointment(100L, "Patient feeling unwell");

            // Assert
            assertThat(confirmed.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
            assertThat(confirmed.getCancellationReason()).isEqualTo("Patient feeling unwell");
            verify(appointmentRepository).save(confirmed);
            verify(auditLogService).logCurrentActor(eq("APPOINTMENT_CANCELLED"), eq("APPOINTMENT"), eq(100L), any());
        }

        @Test
        @DisplayName("Should reject cancelling an already CANCELLED appointment")
        void cancelAppointment_AlreadyCancelled_ThrowsInvalidStatusTransitionException() {
            // Arrange
            Appointment cancelled = Appointment.builder()
                    .id(100L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .status(AppointmentStatus.CANCELLED)
                    .build();

            when(appointmentRepository.findById(100L)).thenReturn(Optional.of(cancelled));

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.cancelAppointment(100L, "Another cancel"))
                    .isInstanceOf(InvalidStatusTransitionException.class);
        }
    }

    @Nested
    @DisplayName("Reschedule Conflict & Business Rule Tests")
    class RescheduleTests {

        @Test
        @DisplayName("Should successfully reschedule appointment to a new available slot")
        void rescheduleAppointment_Success() {
            // Arrange
            Appointment appointment = Appointment.builder()
                    .id(100L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .appointmentDate(futureDate)
                    .appointmentTime(slotTime)
                    .status(AppointmentStatus.CONFIRMED)
                    .build();

            LocalDate newDate = futureDate.plusWeeks(1);
            while (newDate.getDayOfWeek() != DayOfWeek.TUESDAY) {
                newDate = newDate.plusDays(1);
            }
            LocalTime newTime = LocalTime.of(14, 0);

            AppointmentRescheduleRequest request = new AppointmentRescheduleRequest();
            request.setNewDate(newDate);
            request.setNewTime(newTime);
            request.setRescheduleReason("Work meeting conflict");

            when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
            when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndIdNot(
                    eq(1L), eq(newDate), eq(newTime), any(), eq(100L)
            )).thenReturn(false);
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
            when(appointmentMapper.toResponse(appointment)).thenReturn(
                    AppointmentResponse.builder().id(100L).appointmentDate(newDate).appointmentTime(newTime).build()
            );

            // Act
            AppointmentResponse response = appointmentService.rescheduleAppointment(100L, request);

            // Assert
            assertThat(appointment.getAppointmentDate()).isEqualTo(newDate);
            assertThat(appointment.getAppointmentTime()).isEqualTo(newTime);
            assertThat(appointment.getNotes()).contains("Work meeting conflict");
            verify(appointmentRepository).save(appointment);
        }

        @Test
        @DisplayName("Should detect conflict and reject reschedule if target slot is occupied by another patient")
        void rescheduleAppointment_ConflictDetected_ThrowsAppointmentConflictException() {
            // Arrange
            Appointment appointment = Appointment.builder()
                    .id(100L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .appointmentDate(futureDate)
                    .appointmentTime(slotTime)
                    .status(AppointmentStatus.CONFIRMED)
                    .build();

            LocalDate newDate = futureDate.plusWeeks(1);
            while (newDate.getDayOfWeek() != DayOfWeek.MONDAY) {
                newDate = newDate.plusDays(1);
            }
            LocalTime newTime = LocalTime.of(11, 0);

            AppointmentRescheduleRequest request = new AppointmentRescheduleRequest();
            request.setNewDate(newDate);
            request.setNewTime(newTime);

            when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
            when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndIdNot(
                    eq(1L), eq(newDate), eq(newTime), any(), eq(100L)
            )).thenReturn(true); // Target slot already has an appointment

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.rescheduleAppointment(100L, request))
                    .isInstanceOf(AppointmentConflictException.class)
                    .hasMessageContaining("already booked");

            verify(appointmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject rescheduling an appointment that is already CANCELLED")
        void rescheduleAppointment_CancelledAppointment_ThrowsBusinessRuleException() {
            // Arrange
            Appointment cancelled = Appointment.builder()
                    .id(100L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .status(AppointmentStatus.CANCELLED)
                    .build();

            AppointmentRescheduleRequest request = new AppointmentRescheduleRequest();
            when(appointmentRepository.findById(100L)).thenReturn(Optional.of(cancelled));

            // Act & Assert
            assertThatThrownBy(() -> appointmentService.rescheduleAppointment(100L, request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Cancelled appointments cannot be rescheduled");
        }
    }
}
