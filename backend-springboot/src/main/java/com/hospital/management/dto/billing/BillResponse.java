package com.hospital.management.dto.billing;

import com.hospital.management.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {
    private Long id;
    private String billNumber;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long admissionId;
    private Long appointmentId;
    private String billType;
    private LocalDate billDate;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal netAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceDue;
    private BigDecimal pendingAmount;
    private BigDecimal taxRate;
    private BigDecimal discountPercentage;
    private String discountReason;
    private PaymentStatus paymentStatus;
    private List<BillItemDTO> items;
    private List<PaymentResponse> payments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillItemDTO {
        private Long id;
        private String itemDescription;
        private String itemType;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}
