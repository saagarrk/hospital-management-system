package com.hospital.management.mapper;

import com.hospital.management.dto.billing.BillResponse;
import com.hospital.management.dto.billing.PaymentResponse;
import com.hospital.management.entity.Bill;
import com.hospital.management.entity.BillItem;
import com.hospital.management.enums.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BillMapper {

    private final PaymentMapper paymentMapper;

    public BillResponse toResponse(Bill bill) {
        if (bill == null) return null;

        BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal net = bill.getNetAmount() != null ? bill.getNetAmount() : BigDecimal.ZERO;
        BigDecimal balance = net.subtract(paid).max(BigDecimal.ZERO);

        PaymentStatus status = PaymentStatus.UNPAID;
        if (bill.getPaymentStatus() != null) {
            try {
                status = PaymentStatus.valueOf(bill.getPaymentStatus());
            } catch (Exception ignored) {
            }
        }

        List<BillResponse.BillItemDTO> itemDTOs = bill.getItems() != null
                ? bill.getItems().stream().map(this::toItemDTO).collect(Collectors.toList())
                : Collections.emptyList();

        List<PaymentResponse> paymentDTOs = bill.getPayments() != null
                ? bill.getPayments().stream().map(paymentMapper::toResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return BillResponse.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .patientId(bill.getPatient() != null ? bill.getPatient().getId() : null)
                .patientName(bill.getPatient() != null ? bill.getPatient().getName() : null)
                .patientCode(bill.getPatient() != null ? bill.getPatient().getPatientCode() : null)
                .admissionId(bill.getAdmissionId())
                .appointmentId(bill.getAppointmentId())
                .billType(bill.getBillType())
                .billDate(bill.getBillDate())
                .totalAmount(bill.getTotalAmount())
                .discountAmount(bill.getDiscountAmount())
                .discountPercentage(bill.getDiscountPercentage())
                .discountReason(bill.getDiscountReason())
                .taxRate(bill.getTaxRate())
                .taxAmount(bill.getTaxAmount())
                .netAmount(net)
                .paidAmount(paid)
                .balanceDue(balance)
                .pendingAmount(balance)
                .paymentStatus(status)
                .items(itemDTOs)
                .payments(paymentDTOs)
                .build();
    }

    public BillResponse.BillItemDTO toItemDTO(BillItem item) {
        if (item == null) return null;
        return BillResponse.BillItemDTO.builder()
                .id(item.getId())
                .itemDescription(item.getItemDescription())
                .itemType(item.getItemType())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }
}
