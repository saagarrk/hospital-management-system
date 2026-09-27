package com.hospital.management.mapper;

import com.hospital.management.dto.billing.PaymentResponse;
import com.hospital.management.entity.Payment;
import com.hospital.management.enums.PaymentMethod;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        if (payment == null) return null;

        PaymentMethod method = PaymentMethod.CASH;
        if (payment.getPaymentMethod() != null) {
            try {
                method = PaymentMethod.valueOf(payment.getPaymentMethod().toUpperCase());
            } catch (Exception ignored) {
            }
        }

        return PaymentResponse.builder()
                .id(payment.getId())
                .paymentReceiptNumber("RCP-" + payment.getId())
                .billId(payment.getBill() != null ? payment.getBill().getId() : null)
                .billNumber(payment.getBill() != null ? payment.getBill().getBillNumber() : null)
                .amount(payment.getAmount())
                .paymentMethod(method)
                .transactionReference(payment.getTransactionReference())
                .paymentDate(payment.getPaymentDate())
                .status(payment.getStatus() != null ? payment.getStatus() : "COMPLETED")
                .build();
    }
}
