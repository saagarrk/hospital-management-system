package com.hospital.management.service;

import com.hospital.management.dto.patient.PatientRequest;
import com.hospital.management.dto.patient.PatientResponse;
import com.hospital.management.entity.Patient;
import com.hospital.management.entity.User;
import com.hospital.management.enums.BloodGroup;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.DuplicateResourceException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.PatientMapper;
import com.hospital.management.repository.*;
import com.hospital.management.service.impl.PatientServiceImpl;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientService Business Logic & Authorization Tests")
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private AdmissionRepository admissionRepository;

    @Mock
    private PatientMapper patientMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private PatientServiceImpl patientService;

    private Patient samplePatient;
    private User patientUser;

    @BeforeEach
    void setUp() {
        patientUser = User.builder()
                .id(10L)
                .username("patient_alice")
                .email("alice@example.com")
                .role(Role.PATIENT)
                .build();

        samplePatient = Patient.builder()
                .id(1L)
                .patientCode("PT-0001")
                .name("Alice Smith")
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .gender(Gender.FEMALE)
                .bloodGroup("O+")
                .phone("555-0100")
                .email("alice@example.com")
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
    @DisplayName("Patient Creation Tests")
    class CreatePatientTests {

        @Test
        @DisplayName("Should create patient and auto-generate unique medical record number (PT-0001)")
        void createPatient_Success() {
            // Arrange
            PatientRequest request = new PatientRequest();
            request.setName("Alice Smith");
            request.setPhone("555-0100");
            request.setEmail("alice@example.com");
            request.setGender(Gender.FEMALE);
            request.setDateOfBirth(LocalDate.of(1990, 5, 15));

            when(patientRepository.existsByPhone("555-0100")).thenReturn(false);
            when(patientRepository.existsByEmail("alice@example.com")).thenReturn(false);
            when(patientRepository.count()).thenReturn(0L);
            when(patientRepository.existsByPatientCode("PT-0001")).thenReturn(false);

            Patient newPatientEntity = Patient.builder().build();
            when(patientMapper.toEntity(request)).thenReturn(newPatientEntity);
            when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
                Patient p = invocation.getArgument(0);
                p.setId(1L);
                return p;
            });

            PatientResponse response = PatientResponse.builder()
                    .id(1L)
                    .patientCode("PT-0001")
                    .name("Alice Smith")
                    .build();
            when(patientMapper.toResponse(any(Patient.class))).thenReturn(response);

            // Act
            PatientResponse result = patientService.createPatient(request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getPatientCode()).isEqualTo("PT-0001");
            verify(patientRepository).save(argThat(p ->
                    "PT-0001".equals(p.getPatientCode()) &&
                    p.getStatus() == PatientStatus.ACTIVE
            ));
            verify(auditLogService).logCurrentActor(eq("PATIENT_REGISTERED"), eq("PATIENT"), eq(1L), any());
        }

        @Test
        @DisplayName("Should reject patient creation when phone number already exists")
        void createPatient_DuplicatePhone_ThrowsDuplicateResourceException() {
            // Arrange
            PatientRequest request = new PatientRequest();
            request.setPhone("555-0100");

            when(patientRepository.existsByPhone("555-0100")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> patientService.createPatient(request))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("mobile number 555-0100 is already registered");

            verify(patientRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject patient creation when email already exists")
        void createPatient_DuplicateEmail_ThrowsDuplicateResourceException() {
            // Arrange
            PatientRequest request = new PatientRequest();
            request.setPhone("555-0200");
            request.setEmail("alice@example.com");

            when(patientRepository.existsByPhone("555-0200")).thenReturn(false);
            when(patientRepository.existsByEmail("alice@example.com")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> patientService.createPatient(request))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("email address alice@example.com is already registered");

            verify(patientRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Patient Update Tests")
    class UpdatePatientTests {

        @Test
        @DisplayName("Should successfully update patient demographics")
        void updatePatient_Success() {
            // Arrange
            PatientRequest updateRequest = new PatientRequest();
            updateRequest.setName("Alice Johnson");
            updateRequest.setPhone("555-0100");
            updateRequest.setGender(Gender.FEMALE);
            updateRequest.setEmergencyContactName("Bob Johnson");
            updateRequest.setEmergencyContactPhone("555-9999");

            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
            when(patientRepository.existsByPhoneAndIdNot("555-0100", 1L)).thenReturn(false);
            when(patientRepository.save(any(Patient.class))).thenReturn(samplePatient);
            when(patientMapper.toResponse(samplePatient)).thenReturn(PatientResponse.builder().name("Alice Johnson").build());

            // Act
            PatientResponse response = patientService.updatePatient(1L, updateRequest);

            // Assert
            assertThat(response.getName()).isEqualTo("Alice Johnson");
            assertThat(samplePatient.getName()).isEqualTo("Alice Johnson");
            verify(patientRepository).save(samplePatient);
        }

        @Test
        @DisplayName("Should reject update if new phone number is used by another patient")
        void updatePatient_PhoneCollision_ThrowsDuplicateResourceException() {
            // Arrange
            PatientRequest updateRequest = new PatientRequest();
            updateRequest.setPhone("555-COLLIDE");

            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
            when(patientRepository.existsByPhoneAndIdNot("555-COLLIDE", 1L)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> patientService.updatePatient(1L, updateRequest))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("already used by another patient");

            verify(patientRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when updating non-existent patient")
        void updatePatient_NotFound_ThrowsResourceNotFoundException() {
            // Arrange
            PatientRequest updateRequest = new PatientRequest();
            when(patientRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> patientService.updatePatient(999L, updateRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Authorization & Data Isolation (HIPAA / SRS Rule 9)")
    class AuthorizationTests {

        @Test
        @DisplayName("Should allow clinical staff (ADMIN, DOCTOR) to view any patient")
        void getPatientById_ClinicalStaffAccess_Success() {
            // Arrange: Authenticated as DOCTOR
            mockAuthentication("dr_smith", "ROLE_DOCTOR");
            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
            when(patientMapper.toResponse(samplePatient)).thenReturn(PatientResponse.builder().id(1L).build());

            // Act
            PatientResponse response = patientService.getPatientById(1L);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should allow PATIENT user to view their own patient profile")
        void getPatientById_PatientAccessOwnRecord_Success() {
            // Arrange: Authenticated as Alice (owner of samplePatient)
            mockAuthentication("patient_alice", "ROLE_PATIENT");
            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
            when(patientMapper.toResponse(samplePatient)).thenReturn(PatientResponse.builder().id(1L).build());

            // Act
            PatientResponse response = patientService.getPatientById(1L);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should deny PATIENT user from accessing another patient's medical records")
        void getPatientById_PatientAccessOtherRecord_ThrowsUnauthorizedActionException() {
            // Arrange: Authenticated as Bob, attempting to access Alice's records
            mockAuthentication("patient_bob", "ROLE_PATIENT");
            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));

            // Act & Assert
            assertThatThrownBy(() -> patientService.getPatientById(1L))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("SRS Rule 9 Security Violation");
        }
    }

    @Nested
    @DisplayName("Patient Deletion & Archiving")
    class DeletePatientTests {

        @Test
        @DisplayName("Should soft-delete patient to ARCHIVED status to maintain medical audit compliance")
        void deletePatient_SoftDelete_SetsStatusToArchived() {
            // Arrange
            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));

            // Act
            patientService.deletePatient(1L);

            // Assert
            assertThat(samplePatient.getStatus()).isEqualTo(PatientStatus.ARCHIVED);
            verify(patientRepository).save(samplePatient);
        }
    }
}
