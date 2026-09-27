package com.hospital.management.service;

import com.hospital.management.dto.pharmacy.MedicineRequest;
import com.hospital.management.dto.pharmacy.MedicineResponse;
import com.hospital.management.entity.InventoryTransaction;
import com.hospital.management.entity.Medicine;
import com.hospital.management.entity.User;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.InsufficientStockException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.MedicineMapper;
import com.hospital.management.repository.InventoryTransactionRepository;
import com.hospital.management.repository.MedicineRepository;
import com.hospital.management.repository.PrescriptionItemRepository;
import com.hospital.management.repository.PrescriptionRepository;
import com.hospital.management.repository.UserRepository;
import com.hospital.management.service.impl.PharmacyServiceImpl;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PharmacyService Stock Validation & Dispense Safety Tests")
class PharmacyServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PrescriptionItemRepository prescriptionItemRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MedicineMapper medicineMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private PharmacyServiceImpl pharmacyService;

    private User pharmacistUser;
    private Medicine sampleMedicine;

    @BeforeEach
    void setUp() {
        pharmacistUser = User.builder()
                .id(5L)
                .username("pharm_john")
                .role(Role.PHARMACIST)
                .build();

        sampleMedicine = Medicine.builder()
                .id(1L)
                .name("Paracetamol 500mg")
                .batchNumber("BATCH-2026-A")
                .stockQuantity(100)
                .minStockAlert(20)
                .unitPrice(BigDecimal.valueOf(5.00))
                .expiryDate(LocalDate.now().plusYears(1))
                .status("AVAILABLE")
                .build();
    }

    private void mockPharmacistAuth() {
        when(userRepository.findByUsername("pharm_john")).thenReturn(Optional.of(pharmacistUser));
    }

    @Nested
    @DisplayName("Medicine Catalog & Expiry Prevention Tests")
    class CatalogTests {

        @Test
        @DisplayName("Should successfully add medicine with future expiry and valid price")
        void addMedicine_Success() {
            // Arrange
            mockPharmacistAuth();
            MedicineRequest request = new MedicineRequest();
            request.setName("Paracetamol 500mg");
            request.setBatchNumber("BATCH-001");
            request.setUnitPrice(BigDecimal.valueOf(5.00));
            request.setStockQuantity(50);
            request.setMinStockAlert(10);
            request.setExpiryDate(LocalDate.now().plusMonths(18));

            Medicine entity = Medicine.builder().id(1L).stockQuantity(50).build();
            when(medicineMapper.toEntity(request)).thenReturn(entity);
            when(medicineRepository.save(any(Medicine.class))).thenReturn(entity);
            when(medicineMapper.toResponse(entity)).thenReturn(MedicineResponse.builder().id(1L).name("Paracetamol 500mg").build());

            // Act
            MedicineResponse response = pharmacyService.addMedicine(request, "pharm_john");

            // Assert
            assertThat(response).isNotNull();
            verify(medicineRepository).save(entity);
            verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
        }

        @Test
        @DisplayName("Should reject adding medicine with a past expiry date")
        void addMedicine_PastExpiry_ThrowsBusinessRuleException() {
            // Arrange
            mockPharmacistAuth();
            MedicineRequest request = new MedicineRequest();
            request.setName("Expired Drug");
            request.setBatchNumber("BATCH-OLD");
            request.setUnitPrice(BigDecimal.valueOf(10.00));
            request.setExpiryDate(LocalDate.now().minusDays(1)); // Expired!

            // Act & Assert
            assertThatThrownBy(() -> pharmacyService.addMedicine(request, "pharm_john"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("must have a future expiration date");

            verify(medicineRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject deleting medicine when units remain in stock")
        void deleteMedicine_StockRemaining_ThrowsBusinessRuleException() {
            // Arrange
            mockPharmacistAuth();
            when(medicineRepository.findById(1L)).thenReturn(Optional.of(sampleMedicine));

            // Act & Assert
            assertThatThrownBy(() -> pharmacyService.deleteMedicine(1L, "pharm_john"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("because there are still 100 units in stock")
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

            verify(medicineRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Stock Management & Validation Tests")
    class StockAdjustmentTests {

        @Test
        @DisplayName("Should increase stock and record audit transaction on manual restock")
        void updateStock_Restock_Success() {
            // Arrange
            mockPharmacistAuth();
            when(medicineRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleMedicine));
            when(medicineRepository.save(any(Medicine.class))).thenAnswer(inv -> inv.getArgument(0));
            when(medicineMapper.toResponse(any(Medicine.class))).thenReturn(MedicineResponse.builder().id(1L).stockQuantity(150).build());

            // Act: Add 50 units
            MedicineResponse response = pharmacyService.updateStock(1L, 50, "Restock order #42", "pharm_john");

            // Assert
            assertThat(sampleMedicine.getStockQuantity()).isEqualTo(150);
            assertThat(sampleMedicine.getStatus()).isEqualTo("AVAILABLE");
            verify(inventoryTransactionRepository).save(argThat(tx ->
                    "STOCK_IN".equals(tx.getTransactionType()) &&
                    tx.getQuantity() == 50 &&
                    tx.getPreviousStock() == 100 &&
                    tx.getNewStock() == 150
            ));
            verify(auditLogService).recordEvent(eq("pharm_john"), eq("PHARMACIST"), eq("MEDICINE_STOCK_CHANGED"), eq("MEDICINE"), eq(1L), eq("SUCCESS"), any());
        }

        @Test
        @DisplayName("Should reject stock adjustment that would result in negative quantity")
        void updateStock_NegativeResult_ThrowsBusinessRuleException() {
            // Arrange
            mockPharmacistAuth();
            when(medicineRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleMedicine)); // Stock: 100

            // Act & Assert: Attempt to deduct 150 units
            assertThatThrownBy(() -> pharmacyService.updateStock(1L, -150, "Audit write-off", "pharm_john"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Stock quantity cannot become negative");

            verify(inventoryTransactionRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Dispense Safety: Stock & Expired Drug Prevention Tests")
    class DispenseTests {

        @Test
        @DisplayName("Should successfully dispense medicine when stock is sufficient and drug is active")
        void dispenseMedicine_Success() {
            // Arrange
            mockPharmacistAuth();
            when(medicineRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleMedicine)); // Stock: 100
            when(medicineRepository.save(any(Medicine.class))).thenAnswer(inv -> inv.getArgument(0));
            when(medicineMapper.toResponse(any(Medicine.class))).thenReturn(MedicineResponse.builder().id(1L).stockQuantity(80).build());

            // Act: Dispense 20 units
            MedicineResponse response = pharmacyService.dispenseMedicine(1L, 20, "Rx #100 dispense", "pharm_john");

            // Assert
            assertThat(sampleMedicine.getStockQuantity()).isEqualTo(80);
            verify(medicineRepository).save(sampleMedicine);
            verify(inventoryTransactionRepository).save(argThat(tx ->
                    "DISPENSE".equals(tx.getTransactionType()) &&
                    tx.getQuantity() == -20 &&
                    tx.getPreviousStock() == 100 &&
                    tx.getNewStock() == 80
            ));
        }

        @Test
        @DisplayName("Should reject dispense and throw InsufficientStockException when requested units exceed stock")
        void dispenseMedicine_InsufficientStock_ThrowsInsufficientStockException() {
            // Arrange
            mockPharmacistAuth();
            sampleMedicine.setStockQuantity(10); // Only 10 available
            when(medicineRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleMedicine));

            // Act & Assert: Request 25 units
            assertThatThrownBy(() -> pharmacyService.dispenseMedicine(1L, 25, "Rx Dispense", "pharm_john"))
                    .isInstanceOf(InsufficientStockException.class)
                    .hasMessageContaining("Insufficient stock for medicine 'Paracetamol 500mg'");

            verify(medicineRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject dispensing expired medicine to protect patient health (SRS Rule 10/12)")
        void dispenseMedicine_ExpiredDrug_ThrowsBusinessRuleException() {
            // Arrange
            mockPharmacistAuth();
            sampleMedicine.setExpiryDate(LocalDate.now().minusWeeks(2)); // Expired!
            when(medicineRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleMedicine));

            // Act & Assert
            assertThatThrownBy(() -> pharmacyService.dispenseMedicine(1L, 5, "Rx Dispense", "pharm_john"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("expired on")
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

            verify(medicineRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should deny dispensing by unauthorized non-pharmacist roles")
        void dispenseMedicine_UnauthorizedUser_ThrowsUnauthorizedActionException() {
            // Arrange: Nurse user
            User nurseUser = User.builder().id(3L).username("nurse_betty").role(Role.NURSE).build();
            when(userRepository.findByUsername("nurse_betty")).thenReturn(Optional.of(nurseUser));

            // Act & Assert
            assertThatThrownBy(() -> pharmacyService.dispenseMedicine(1L, 5, "Notes", "nurse_betty"))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("Only licensed Pharmacists or Administrators");
        }
    }
}
