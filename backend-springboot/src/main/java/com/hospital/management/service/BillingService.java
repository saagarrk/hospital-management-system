package com.hospital.management.service;

import com.hospital.management.dto.billing.*;
import com.hospital.management.dto.common.PagedResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BillingService {
    BillResponse createBill(BillCreateRequest request);
    BillResponse addBillItems(Long billId, List<BillItemRequest> items);
    BillResponse applyDiscount(Long billId, DiscountRequest request);
    BillResponse recordPayment(Long billId, PaymentRequest request);
    List<PaymentResponse> getPaymentHistory(Long billId);
    BillResponse getBillById(Long id);
    BillResponse getBillByAdmissionId(Long admissionId);
    List<BillResponse> getBillsByPatient(Long patientId);
    PatientBillingSummaryResponse getPatientBillingSummary(Long patientId);
    PagedResponse<BillResponse> getAllBills(String paymentStatus, Pageable pageable);
}
