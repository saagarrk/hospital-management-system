package com.hospital.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.management.dto.billing.BillCreateRequest;
import com.hospital.management.dto.billing.BillItemRequest;
import com.hospital.management.dto.billing.BillResponse;
import com.hospital.management.dto.billing.PaymentRequest;
import com.hospital.management.enums.PaymentMethod;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.GlobalExceptionHandler;
import com.hospital.management.service.BillingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingController REST Endpoint Integration Tests")
class BillingControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private BillingService billingService;

    @InjectMocks
    private BillingController billingController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(billingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/billing/bills - Success (HTTP 201 Created)")
    void createBill_Success() throws Exception {
        BillItemRequest item = new BillItemRequest();
        item.setItemDescription("General Consultation");
        item.setItemType("CONSULTATION");
        item.setQuantity(1);
        item.setUnitPrice(BigDecimal.valueOf(100.00));

        BillCreateRequest request = new BillCreateRequest();
        request.setPatientId(1L);
        request.setBillType("OUTPATIENT");
        request.setItems(List.of(item));

        BillResponse response = BillResponse.builder()
                .id(50L)
                .billNumber("INV-2026-0042")
                .totalAmount(BigDecimal.valueOf(100.00))
                .netAmount(BigDecimal.valueOf(110.00)) // with 10% tax
                .paymentStatus("UNPAID")
                .build();

        when(billingService.createBill(any(BillCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/billing/bills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.billNumber").value("INV-2026-0042"))
                .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"));
    }

    @Test
    @DisplayName("POST /api/billing/bills/{id}/payments - Success (HTTP 200 OK)")
    void recordPayment_Success() throws Exception {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(BigDecimal.valueOf(110.00));
        request.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        request.setTransactionReference("TXN-PAY-001");

        BillResponse response = BillResponse.builder()
                .id(50L)
                .billNumber("INV-2026-0042")
                .paidAmount(BigDecimal.valueOf(110.00))
                .paymentStatus("PAID")
                .build();

        when(billingService.recordPayment(eq(50L), any(PaymentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/billing/bills/50/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"));
    }

    @Test
    @DisplayName("POST /api/billing/bills/{id}/payments - Overpayment Error (HTTP 400 Bad Request)")
    void recordPayment_Overpayment_Returns400() throws Exception {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(BigDecimal.valueOf(500.00));
        request.setPaymentMethod(PaymentMethod.CASH);

        when(billingService.recordPayment(eq(50L), any(PaymentRequest.class)))
                .thenThrow(new BusinessRuleException("Payment amount ($500.00) exceeds outstanding balance ($110.00)"));

        mockMvc.perform(post("/api/billing/bills/50/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").contains("exceeds outstanding balance"));
    }

    @Test
    @DisplayName("POST /api/billing/bills/{id}/payments - Duplicate Payment Reference Conflict (HTTP 409 Conflict)")
    void recordPayment_DuplicateReference_Returns409() throws Exception {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(BigDecimal.valueOf(50.00));
        request.setPaymentMethod(PaymentMethod.UPI);
        request.setTransactionReference("DUPLICATE-REF");

        when(billingService.recordPayment(eq(50L), any(PaymentRequest.class)))
                .thenThrow(new ConflictException("Duplicate payment detected: Transaction reference 'DUPLICATE-REF' has already been processed."));

        mockMvc.perform(post("/api/billing/bills/50/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").contains("Duplicate payment detected"));
    }
}
