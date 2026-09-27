package com.hospital.management.service;

import com.hospital.management.dto.admission.AdmissionRequest;
import com.hospital.management.dto.admission.AdmissionResponse;
import com.hospital.management.dto.admission.BedTransferRequest;
import com.hospital.management.dto.admission.DischargeRequest;
import com.hospital.management.dto.admission.DischargeSummaryResponse;
import com.hospital.management.entity.*;
import com.hospital.management.exception.BedUnavailableException;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.mapper.*;
import com.hospital.management.repository.*;
import com.hospital.management.service.impl.InpatientServiceImpl;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InpatientService Admission, Bed Allocation & Discharge Rules Tests")
class InpatientServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BedRepository bedRepository;

    @Mock
    private AdmissionRepository admissionRepository;

    @Mock
    private DischargeRepository dischargeRepository;

    @Mock
    private BedTransferHistoryRepository bedTransferHistoryRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private BillRepository billRepository;

    @Mock
    private RoomMapper roomMapper;

    @Mock
    private BedMapper bedMapper;

    @Mock
    private AdmissionMapper admissionMapper;

    @Mock
    private BedTransferHistoryMapper bedTransferHistoryMapper;

    @Mock
    private DischargeSummaryMapper dischargeSummaryMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private InpatientServiceImpl inpatientService;

    private Patient samplePatient;
    private Doctor sampleDoctor;
    private Room sampleRoom;
    private Bed availableBed;
    private Bed occupiedBed;

    @BeforeEach
    void setUp() {
        samplePatient = Patient.builder()
                .id(1L)
                .name("Bob Vance")
                .patientCode("PT-0001")
                .build();

        sampleDoctor = Doctor.builder()
                .id(2L)
                .name("Dr. Cuddy")
                .email("cuddy@hospital.com")
                .build();

        sampleRoom = Room.builder()
                .id(10L)
                .roomNumber("ICU-101")
                .roomType("ICU")
                .dailyRate(BigDecimal.valueOf(500.00))
                .build();

        availableBed = Bed.builder()
                .id(100L)
                .bedNumber("B1")
                .room(sampleRoom)
                .status("AVAILABLE")
                .build();

        occupiedBed = Bed.builder()
                .id(101L)
                .bedNumber("B2")
                .room(sampleRoom)
                .status("OCCUPIED")
                .build();
    }

    @Nested
    @DisplayName("Patient Admission & Bed Allocation Rules")
    class AdmissionTests {

        @Test
        @DisplayName("Should successfully admit patient and synchronize bed status to OCCUPIED")
        void admitPatient_Success() {
            // Arrange
            AdmissionRequest request = new AdmissionRequest();
            request.setPatientId(1L);
            request.setDoctorId(2L);
            request.setBedId(100L);
            request.setReasonForAdmission("Acute cardiac observation");

            when(admissionRepository.existsByPatientIdAndStatus(1L, "ADMITTED")).thenReturn(false);
            when(bedRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(availableBed));
            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
            when(doctorRepository.findById(2L)).thenReturn(Optional.of(sampleDoctor));

            when(admissionRepository.save(any(Admission.class))).thenAnswer(inv -> {
                Admission adm = inv.getArgument(0);
                adm.setId(500L);
                return adm;
            });
            when(admissionMapper.toResponse(any(Admission.class))).thenReturn(
                    AdmissionResponse.builder().id(500L).status("ADMITTED").build()
            );

            // Act
            AdmissionResponse response = inpatientService.admitPatient(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(500L);

            // Verify bed state was atomically synchronized
            assertThat(availableBed.getStatus()).isEqualTo("OCCUPIED");
            assertThat(availableBed.getCurrentPatient()).isEqualTo(samplePatient);
            assertThat(availableBed.getAdmissionId()).isEqualTo(500L);
            verify(bedRepository).save(availableBed);

            verify(auditLogService).logCurrentActor(eq("ADMISSION"), eq("ADMISSION"), eq(500L), any());
        }

        @Test
        @DisplayName("Should reject admission when patient already has an active hospital admission")
        void admitPatient_AlreadyActiveAdmission_ThrowsConflictException() {
            // Arrange
            AdmissionRequest request = new AdmissionRequest();
            request.setPatientId(1L);
            request.setDoctorId(2L);
            request.setBedId(100L);

            when(admissionRepository.existsByPatientIdAndStatus(1L, "ADMITTED")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> inpatientService.admitPatient(request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Patient already has an active hospital admission");

            verify(bedRepository, never()).findByIdForUpdate(any());
        }

        @Test
        @DisplayName("Should reject allocation when requested bed is not AVAILABLE (e.g. OCCUPIED)")
        void admitPatient_BedNotAvailable_ThrowsBedUnavailableException() {
            // Arrange
            AdmissionRequest request = new AdmissionRequest();
            request.setPatientId(1L);
            request.setDoctorId(2L);
            request.setBedId(101L);

            when(admissionRepository.existsByPatientIdAndStatus(1L, "ADMITTED")).thenReturn(false);
            when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(occupiedBed));

            // Act & Assert
            assertThatThrownBy(() -> inpatientService.admitPatient(request))
                    .isInstanceOf(BedUnavailableException.class)
                    .hasMessageContaining("Bed B2 is currently OCCUPIED and cannot be assigned");

            verify(admissionRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Bed Transfer Rules")
    class BedTransferTests {

        @Test
        @DisplayName("Should atomically transfer patient from Bed A to Bed B and record transfer history")
        void transferBed_Success() {
            // Arrange
            Bed targetBed = Bed.builder().id(102L).bedNumber("B3").room(sampleRoom).status("AVAILABLE").build();

            Admission admission = Admission.builder()
                    .id(500L)
                    .patient(samplePatient)
                    .bed(availableBed)
                    .doctor(sampleDoctor)
                    .status("ADMITTED")
                    .build();
            availableBed.setStatus("OCCUPIED");
            availableBed.setCurrentPatient(samplePatient);
            availableBed.setAdmissionId(500L);

            BedTransferRequest request = new BedTransferRequest();
            request.setTargetBedId(102L);
            request.setReason("Transferred to general ward");
            request.setTransferredBy("Nurse Joy");

            when(admissionRepository.findByIdForUpdate(500L)).thenReturn(Optional.of(admission));
            when(bedRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(targetBed));
            when(bedRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(availableBed));
            when(admissionRepository.save(any(Admission.class))).thenReturn(admission);
            when(admissionMapper.toResponse(any(Admission.class))).thenReturn(AdmissionResponse.builder().id(500L).build());

            // Act
            AdmissionResponse response = inpatientService.transferBed(500L, request);

            // Assert
            assertThat(response).isNotNull();
            // Source bed released
            assertThat(availableBed.getStatus()).isEqualTo("AVAILABLE");
            assertThat(availableBed.getCurrentPatient()).isNull();
            assertThat(availableBed.getAdmissionId()).isNull();

            // Target bed occupied
            assertThat(targetBed.getStatus()).isEqualTo("OCCUPIED");
            assertThat(targetBed.getCurrentPatient()).isEqualTo(samplePatient);
            assertThat(targetBed.getAdmissionId()).isEqualTo(500L);

            verify(bedTransferHistoryRepository).save(any(BedTransferHistory.class));
        }

        @Test
        @DisplayName("Should reject transfer if target bed is not AVAILABLE")
        void transferBed_TargetBedOccupied_ThrowsBedUnavailableException() {
            // Arrange
            Admission admission = Admission.builder()
                    .id(500L)
                    .patient(samplePatient)
                    .bed(availableBed)
                    .status("ADMITTED")
                    .build();

            BedTransferRequest request = new BedTransferRequest();
            request.setTargetBedId(101L); // Occupied bed

            when(admissionRepository.findByIdForUpdate(500L)).thenReturn(Optional.of(admission));
            when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(occupiedBed));

            // Act & Assert
            assertThatThrownBy(() -> inpatientService.transferBed(500L, request))
                    .isInstanceOf(BedUnavailableException.class);

            verify(bedTransferHistoryRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Discharge Rules & Financial Clearance Check")
    class DischargeTests {

        @Test
        @DisplayName("Should successfully discharge patient when all invoices are fully paid and release bed to AVAILABLE")
        void dischargePatient_Success_AllBillsPaid() {
            // Arrange
            Admission admission = Admission.builder()
                    .id(500L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .bed(availableBed)
                    .admissionDate(LocalDateTime.now().minusDays(3))
                    .status("ADMITTED")
                    .build();

            availableBed.setStatus("OCCUPIED");
            availableBed.setCurrentPatient(samplePatient);
            availableBed.setAdmissionId(500L);

            // Fully paid bill
            Bill paidBill = Bill.builder()
                    .id(1000L)
                    .billNumber("INV-2026-001")
                    .netAmount(BigDecimal.valueOf(1500.00))
                    .paidAmount(BigDecimal.valueOf(1500.00))
                    .paymentStatus("PAID")
                    .build();

            DischargeRequest request = new DischargeRequest();
            request.setDiagnosisSummary("Recovered smoothly");
            request.setTreatmentGiven("Antibiotic therapy and bed rest");
            request.setDischargeAdvice("Follow up in 14 days");

            when(admissionRepository.findByIdForUpdate(500L)).thenReturn(Optional.of(admission));
            when(billRepository.findByAdmissionId(500L)).thenReturn(List.of(paidBill));
            when(bedRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(availableBed));

            // Act
            DischargeSummaryResponse response = inpatientService.dischargePatient(500L, request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAdmissionId()).isEqualTo(500L);
            assertThat(admission.getStatus()).isEqualTo("DISCHARGED");
            assertThat(admission.getDischargeDate()).isNotNull();

            // Verify bed is released
            assertThat(availableBed.getStatus()).isEqualTo("AVAILABLE");
            assertThat(availableBed.getCurrentPatient()).isNull();
            assertThat(availableBed.getAdmissionId()).isNull();

            verify(bedRepository).save(availableBed);
            verify(admissionRepository).save(admission);
            verify(dischargeRepository).save(any(DischargeRecord.class));
            verify(auditLogService).logCurrentActor(eq("DISCHARGE"), eq("ADMISSION"), eq(500L), any());
        }

        @Test
        @DisplayName("Should block discharge when patient has an unpaid invoice balance (Rule 10)")
        void dischargePatient_UnpaidBill_ThrowsBusinessRuleException() {
            // Arrange
            Admission admission = Admission.builder()
                    .id(500L)
                    .patient(samplePatient)
                    .doctor(sampleDoctor)
                    .bed(availableBed)
                    .status("ADMITTED")
                    .build();

            // Unpaid bill ($500 outstanding)
            Bill unpaidBill = Bill.builder()
                    .id(1001L)
                    .billNumber("INV-2026-UNPAID")
                    .netAmount(BigDecimal.valueOf(1500.00))
                    .paidAmount(BigDecimal.valueOf(1000.00))
                    .paymentStatus("PARTIAL")
                    .build();

            DischargeRequest request = new DischargeRequest();
            request.setDiagnosisSummary("Recovered");

            when(admissionRepository.findByIdForUpdate(500L)).thenReturn(Optional.of(admission));
            when(billRepository.findByAdmissionId(500L)).thenReturn(List.of(unpaidBill));

            // Act & Assert
            assertThatThrownBy(() -> inpatientService.dischargePatient(500L, request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Discharge Blocked: Pending unpaid invoice #INV-2026-UNPAID. Outstanding balance: $500.00")
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatus()).isEqualTo(HttpStatus.PAYMENT_REQUIRED));

            // Verify bed was NOT released
            verify(bedRepository, never()).save(any());
            verify(dischargeRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject discharge for an admission that is not currently ADMITTED")
        void dischargePatient_AlreadyDischarged_ThrowsBusinessRuleException() {
            // Arrange
            Admission inactiveAdmission = Admission.builder()
                    .id(500L)
                    .status("DISCHARGED")
                    .build();

            DischargeRequest request = new DischargeRequest();
            when(admissionRepository.findByIdForUpdate(500L)).thenReturn(Optional.of(inactiveAdmission));

            // Act & Assert
            assertThatThrownBy(() -> inpatientService.dischargePatient(500L, request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Patient is already discharged or admission is not active");
        }
    }
}
