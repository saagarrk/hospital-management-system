package com.hospital.management.service;

import com.hospital.management.dto.billing.BillCreateRequest;
import com.hospital.management.dto.billing.BillItemRequest;
import com.hospital.management.dto.billing.BillResponse;
import com.hospital.management.dto.billing.PaymentRequest;
import com.hospital.management.entity.Bill;
import com.hospital.management.entity.Patient;
import com.hospital.management.entity.Payment;
import com.hospital.management.enums.PaymentMethod;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.mapper.BillMapper;
import com.hospital.management.mapper.PaymentMapper;
import com.hospital.management.repository.BillRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.PaymentRepository;
import com.hospital.management.service.impl.BillingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingService Calculations & Payment Processing Tests")
class BillingServiceTest {

    @Mock
    private BillRepository billRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BillMapper billMapper;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private BillingServiceImpl billingService;

    private Patient samplePatient;
    private Bill sampleBill;

    @BeforeEach
    void setUp() {
        samplePatient = Patient.builder()
                .id(1L)
                .name("Dwight Schrute")
                .patientCode("PT-0001")
                .build();

        sampleBill = Bill.builder()
                .id(100L)
                .billNumber("INV-2026-0001")
                .patient(samplePatient)
                .totalAmount(BigDecimal.valueOf(200.00))
                .discountAmount(BigDecimal.valueOf(20.00))
                .taxRate(BigDecimal.valueOf(10.00))
                .taxAmount(BigDecimal.valueOf(18.00))
                .netAmount(BigDecimal.valueOf(198.00)) // (200 - 20) + 10% = 180 + 18 = 198
                .paidAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .paymentStatus("UNPAID")
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("Invoice Creation & Financial Calculations Tests")
    class BillingCalculationTests {

        @Test
        @DisplayName("Should accurately calculate subtotal, discount, 10% tax, and net amount")
        void createBill_CalculationAccuracy_Success() {
            // Arrange
            BillItemRequest item1 = new BillItemRequest();
            item1.setItemDescription("Consultation Fee");
            item1.setItemType("CONSULTATION");
            item1.setQuantity(1);
            item1.setUnitPrice(BigDecimal.valueOf(100.00));

            BillItemRequest item2 = new BillItemRequest();
            item2.setItemDescription("CBC Blood Test");
            item2.setItemType("LAB");
            item2.setQuantity(2);
            item2.setUnitPrice(BigDecimal.valueOf(50.00));

            // Total = 100 + (2 * 50) = 200.00
            // Discount = 20.00
            // Taxable = 180.00
            // 10% Tax = 18.00
            // Net Amount = 198.00

            BillCreateRequest request = new BillCreateRequest();
            request.setPatientId(1L);
            request.setBillType("OUTPATIENT");
            request.setDiscountAmount(BigDecimal.valueOf(20.00));
            request.setItems(List.of(item1, item2));

            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
            when(billRepository.save(any(Bill.class))).thenAnswer(inv -> {
                Bill b = inv.getArgument(0);
                b.setId(100L);
                return b;
            });
            when(billMapper.toResponse(any(Bill.class))).thenReturn(
                    BillResponse.builder()
                            .id(100L)
                            .totalAmount(BigDecimal.valueOf(200.00).setScale(2, RoundingMode.HALF_UP))
                            .discountAmount(BigDecimal.valueOf(20.00).setScale(2, RoundingMode.HALF_UP))
                            .taxAmount(BigDecimal.valueOf(18.00).setScale(2, RoundingMode.HALF_UP))
                            .netAmount(BigDecimal.valueOf(198.00).setScale(2, RoundingMode.HALF_UP))
                            .paymentStatus("UNPAID")
                            .build()
            );

            // Act
            BillResponse response = billingService.createBill(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getTotalAmount()).isEqualByComparingTo("200.00");
            assertThat(response.getDiscountAmount()).isEqualByComparingTo("20.00");
            assertThat(response.getTaxAmount()).isEqualByComparingTo("18.00");
            assertThat(response.getNetAmount()).isEqualByComparingTo("198.00");

            verify(billRepository).save(argThat(bill ->
                    bill.getTotalAmount().compareTo(BigDecimal.valueOf(200.00)) == 0 &&
                    bill.getDiscountAmount().compareTo(BigDecimal.valueOf(20.00)) == 0 &&
                    bill.getTaxAmount().compareTo(BigDecimal.valueOf(18.00)) == 0 &&
                    bill.getNetAmount().compareTo(BigDecimal.valueOf(198.00)) == 0 &&
                    "UNPAID".equals(bill.getPaymentStatus())
            ));
        }

        @Test
        @DisplayName("Should reject invoice creation if item quantity is zero or negative")
        void createBill_InvalidQuantityZero_ThrowsBusinessRuleException() {
            // Arrange
            BillItemRequest item = new BillItemRequest();
            item.setItemDescription("Medicine");
            item.setItemType("PHARMACY");
            item.setQuantity(0); // Invalid!
            item.setUnitPrice(BigDecimal.valueOf(10.00));

            BillCreateRequest request = new BillCreateRequest();
            request.setPatientId(1L);
            request.setItems(List.of(item));

            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));

            // Act & Assert
            assertThatThrownBy(() -> billingService.createBill(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Quantity must be greater than zero");

            verify(billRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject invoice creation if unit price is negative")
        void createBill_NegativeUnitPrice_ThrowsBusinessRuleException() {
            // Arrange
            BillItemRequest item = new BillItemRequest();
            item.setItemDescription("Consultation");
            item.setItemType("CONSULTATION");
            item.setQuantity(1);
            item.setUnitPrice(BigDecimal.valueOf(-25.00)); // Negative price!

            BillCreateRequest request = new BillCreateRequest();
            request.setPatientId(1L);
            request.setItems(List.of(item));

            when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));

            // Act & Assert
            assertThatThrownBy(() -> billingService.createBill(request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Unit price must be non-negative");

            verify(billRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Payment Processing Tests")
    class PaymentProcessingTests {

        @Test
        @DisplayName("Should process partial payment and set status to PARTIAL")
        void recordPayment_PartialPayment_Success() {
            // Arrange: Net amount is 198.00. Pay 100.00.
            PaymentRequest request = new PaymentRequest();
            request.setAmount(BigDecimal.valueOf(100.00));
            request.setPaymentMethod(PaymentMethod.CASH);
            request.setTransactionReference("TXN-PARTIAL-001");

            when(billRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleBill));
            when(paymentRepository.existsByTransactionReference("TXN-PARTIAL-001")).thenReturn(false);
            when(billRepository.save(any(Bill.class))).thenReturn(sampleBill);
            when(billMapper.toResponse(sampleBill)).thenReturn(
                    BillResponse.builder().id(100L).paidAmount(BigDecimal.valueOf(100.00)).paymentStatus("PARTIAL").build()
            );

            // Act
            BillResponse response = billingService.recordPayment(100L, request);

            // Assert
            assertThat(sampleBill.getPaidAmount()).isEqualByComparingTo("100.00");
            assertThat(sampleBill.getPaymentStatus()).isEqualTo("PARTIAL");
            verify(paymentRepository).save(argThat(p ->
                    p.getAmount().compareTo(BigDecimal.valueOf(100.00)) == 0 &&
                    "CASH".equals(p.getPaymentMethod()) &&
                    "COMPLETED".equals(p.getStatus())
            ));
        }

        @Test
        @DisplayName("Should process full payment and set status to PAID")
        void recordPayment_FullPayment_Success() {
            // Arrange: Net amount is 198.00. Pay full 198.00.
            PaymentRequest request = new PaymentRequest();
            request.setAmount(BigDecimal.valueOf(198.00));
            request.setPaymentMethod(PaymentMethod.CREDIT_CARD);
            request.setTransactionReference("TXN-FULL-001");

            when(billRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleBill));
            when(paymentRepository.existsByTransactionReference("TXN-FULL-001")).thenReturn(false);
            when(billRepository.save(any(Bill.class))).thenReturn(sampleBill);
            when(billMapper.toResponse(sampleBill)).thenReturn(
                    BillResponse.builder().id(100L).paidAmount(BigDecimal.valueOf(198.00)).paymentStatus("PAID").build()
            );

            // Act
            BillResponse response = billingService.recordPayment(100L, request);

            // Assert
            assertThat(sampleBill.getPaidAmount()).isEqualByComparingTo("198.00");
            assertThat(sampleBill.getPaymentStatus()).isEqualTo("PAID");
            verify(billRepository).save(sampleBill);
        }

        @Test
        @DisplayName("Should reject payment exceeding remaining outstanding balance")
        void recordPayment_Overpayment_ThrowsBusinessRuleException() {
            // Arrange: Net amount is 198.00. Attempt to pay 250.00.
            PaymentRequest request = new PaymentRequest();
            request.setAmount(BigDecimal.valueOf(250.00));
            request.setPaymentMethod(PaymentMethod.CREDIT_CARD);

            when(billRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleBill));

            // Act & Assert
            assertThatThrownBy(() -> billingService.recordPayment(100L, request))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("exceeds outstanding balance");

            verify(paymentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject duplicate payment by transaction reference (Idempotency Guard)")
        void recordPayment_DuplicateTransactionReference_ThrowsConflictException() {
            // Arrange
            PaymentRequest request = new PaymentRequest();
            request.setAmount(BigDecimal.valueOf(50.00));
            request.setPaymentMethod(PaymentMethod.UPI);
            request.setTransactionReference("DUPLICATE-TXN-123");

            when(billRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleBill));
            when(paymentRepository.existsByTransactionReference("DUPLICATE-TXN-123")).thenReturn(true); // Already processed

            // Act & Assert
            assertThatThrownBy(() -> billingService.recordPayment(100L, request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Duplicate payment detected: Transaction reference 'DUPLICATE-TXN-123' has already been processed");

            verify(paymentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reject payment on an invoice that is already fully PAID")
        void recordPayment_AlreadyPaidInvoice_ThrowsConflictException() {
            // Arrange
            sampleBill.setPaymentStatus("PAID");
            sampleBill.setPaidAmount(BigDecimal.valueOf(198.00));

            PaymentRequest request = new PaymentRequest();
            request.setAmount(BigDecimal.valueOf(20.00));
            request.setPaymentMethod(PaymentMethod.CASH);

            when(billRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleBill));

            // Act & Assert
            assertThatThrownBy(() -> billingService.recordPayment(100L, request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already fully PAID and settled");

            verify(paymentRepository, never()).save(any());
        }
    }
}
