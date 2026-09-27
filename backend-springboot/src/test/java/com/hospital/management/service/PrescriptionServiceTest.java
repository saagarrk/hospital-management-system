package com.hospital.management.service;

import com.hospital.management.dto.prescription.PrescriptionItemDTO;
import com.hospital.management.dto.prescription.PrescriptionRequest;
import com.hospital.management.dto.prescription.PrescriptionResponse;
import com.hospital.management.entity.Doctor;
import com.hospital.management.entity.Medicine;
import com.hospital.management.entity.Patient;
import com.hospital.management.entity.Prescription;
import com.hospital.management.entity.User;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.PrescriptionMapper;
import com.hospital.management.repository.*;
import com.hospital.management.service.impl.PrescriptionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PrescriptionService Business Logic & Safety Tests")
class PrescriptionServiceTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PrescriptionMapper prescriptionMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private PrescriptionServiceImpl prescriptionService;

    private User doctorUser;
    private Doctor doctor;
    private Patient patient;
    private Medicine validMedicine;
    private Medicine expiredMedicine;

    @BeforeEach
    void setUp() {
        doctorUser = User.builder()
                .id(1L)
                .username("dr_house")
                .email("house@hospital.com")
                .role(Role.DOCTOR)
                .build();

        doctor = Doctor.builder()
                .id(1L)
                .name("Dr. Gregory House")
                .email("house@hospital.com")
                .user(doctorUser)
                .build();

        patient = Patient.builder()
                .id(10L)
                .name("Alice Smith")
                .patientCode("PT-0001")
                .build();

        validMedicine = Medicine.builder()
                .id(50L)
                .name("Amoxicillin 500mg")
                .expiryDate(LocalDate.now().plusMonths(12))
                .stockQuantity(100)
                .unitPrice(BigDecimal.valueOf(12.50))
                .build();

        expiredMedicine = Medicine.builder()
                .id(51L)
                .name("Ciprofloxacin 250mg")
                .expiryDate(LocalDate.now().minusDays(10)) // Expired!
                .stockQuantity(50)
                .unitPrice(BigDecimal.valueOf(20.00))
                .build();
    }

    private void mockDoctorResolution() {
        when(userRepository.findByUsername("dr_house")).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUser(doctorUser)).thenReturn(Optional.of(doctor));
    }

    @Nested
    @DisplayName("Prescription Creation Tests")
    class CreatePrescriptionTests {

        @Test
        @DisplayName("Should successfully issue prescription when doctor is authorized and medications are valid")
        void createPrescription_Success() {
            // Arrange
            mockDoctorResolution();
            when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
            when(medicineRepository.findById(50L)).thenReturn(Optional.of(validMedicine));

            PrescriptionItemDTO item = new PrescriptionItemDTO();
            item.setMedicineId(50L);
            item.setDosage("500mg");
            item.setFrequency("TID (Three times daily)");
            item.setDuration("7 days");
            item.setInstructions("Take after meals");

            PrescriptionRequest request = new PrescriptionRequest();
            request.setPatientId(10L);
            request.setGeneralInstructions("Complete full course of antibiotics.");
            request.setItems(List.of(item));

            when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(inv -> {
                Prescription p = inv.getArgument(0);
                p.setId(100L);
                return p;
            });
            when(prescriptionMapper.toResponse(any(Prescription.class))).thenReturn(
                    PrescriptionResponse.builder().id(100L).status("ISSUED").build()
            );

            // Act
            PrescriptionResponse response = prescriptionService.createPrescription(request, "dr_house");

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(100L);
            verify(prescriptionRepository).save(argThat(p ->
                    p.getDoctor().equals(doctor) &&
                    p.getPatient().equals(patient) &&
                    p.getItems().size() == 1 &&
                    "ISSUED".equals(p.getStatus())
            ));
            verify(auditLogService).recordEvent(eq("dr_house"), eq("DOCTOR"), eq("PRESCRIPTION_CREATED"), eq("PRESCRIPTION"), eq(100L), eq("SUCCESS"), any());
        }

        @Test
        @DisplayName("Should reject prescription authoring by non-doctor roles (SRS Rule 4)")
        void createPrescription_UnauthorizedRole_ThrowsUnauthorizedActionException() {
            // Arrange: Nurse user attempting to issue prescription
            User nurseUser = User.builder().id(2L).username("nurse_jackie").role(Role.NURSE).build();
            when(userRepository.findByUsername("nurse_jackie")).thenReturn(Optional.of(nurseUser));

            PrescriptionRequest request = new PrescriptionRequest();
            request.setPatientId(10L);

            // Act & Assert
            assertThatThrownBy(() -> prescriptionService.createPrescription(request, "nurse_jackie"))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("SRS Rule 4 Violation: Only licensed medical doctors or administrators can issue prescriptions");

            verify(prescriptionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should prevent prescribing expired medicines to protect patient safety (SRS Rule 10)")
        void createPrescription_ExpiredMedicine_ThrowsBusinessRuleException() {
            // Arrange
            mockDoctorResolution();
            when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
            when(medicineRepository.findById(51L)).thenReturn(Optional.of(expiredMedicine));

            PrescriptionItemDTO item = new PrescriptionItemDTO();
            item.setMedicineId(51L);
            item.setDosage("250mg");
            item.setFrequency("BID");
            item.setDuration("5 days");

            PrescriptionRequest request = new PrescriptionRequest();
            request.setPatientId(10L);
            request.setItems(List.of(item));

            // Act & Assert
            assertThatThrownBy(() -> prescriptionService.createPrescription(request, "dr_house"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("is EXPIRED")
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

            verify(prescriptionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject prescription without any medication items")
        void createPrescription_EmptyItems_ThrowsBusinessRuleException() {
            // Arrange
            mockDoctorResolution();
            when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));

            PrescriptionRequest request = new PrescriptionRequest();
            request.setPatientId(10L);
            request.setItems(new ArrayList<>());

            // Act & Assert
            assertThatThrownBy(() -> prescriptionService.createPrescription(request, "dr_house"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("must contain at least one medicine item");
        }

        @Test
        @DisplayName("Should reject invalid zero or negative medication dosages")
        void createPrescription_InvalidZeroDosage_ThrowsBusinessRuleException() {
            // Arrange
            mockDoctorResolution();
            when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
            when(medicineRepository.findById(50L)).thenReturn(Optional.of(validMedicine));

            PrescriptionItemDTO item = new PrescriptionItemDTO();
            item.setMedicineId(50L);
            item.setDosage("0mg"); // Invalid dosage!
            item.setFrequency("TID");
            item.setDuration("7 days");

            PrescriptionRequest request = new PrescriptionRequest();
            request.setPatientId(10L);
            request.setItems(List.of(item));

            // Act & Assert
            assertThatThrownBy(() -> prescriptionService.createPrescription(request, "dr_house"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Invalid dosage");
        }
    }
}
