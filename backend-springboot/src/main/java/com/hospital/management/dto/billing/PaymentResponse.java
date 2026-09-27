package com.hospital.management.dto.billing;

import com.hospital.management.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private String paymentReceiptNumber;
    private Long billId;
    private String billNumber;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String transactionReference;
    private LocalDateTime paymentDate;
    private String status;
}
