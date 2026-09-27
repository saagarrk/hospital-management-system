package com.hospital.management.controller;

import com.hospital.management.dto.billing.*;
import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/bills")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<BillResponse>> createBill(@Valid @RequestBody BillCreateRequest request) {
        BillResponse response = billingService.createBill(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Invoice generated successfully"), HttpStatus.CREATED);
    }

    @PostMapping("/bills/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<BillResponse>> addBillItems(
            @PathVariable Long id,
            @Valid @RequestBody List<BillItemRequest> items) {
        BillResponse response = billingService.addBillItems(id, items);
        return ResponseEntity.ok(ApiResponse.success(response, "Bill items added and invoice totals recalculated"));
    }

    @PostMapping("/bills/{id}/discount")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<BillResponse>> applyDiscount(
            @PathVariable Long id,
            @Valid @RequestBody DiscountRequest request) {
        BillResponse response = billingService.applyDiscount(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Authorized discount applied successfully"));
    }

    @PostMapping("/bills/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<BillResponse>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequest request) {
        BillResponse response = billingService.recordPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment credited and receipt issued"));
    }

    @GetMapping("/bills/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentHistory(@PathVariable Long id) {
        List<PaymentResponse> responses = billingService.getPaymentHistory(id);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/bills/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<BillResponse>> getBillById(@PathVariable Long id) {
        BillResponse response = billingService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/bills/{id}/invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PATIENT', 'DOCTOR')")
    public ResponseEntity<ApiResponse<BillResponse>> getInvoice(@PathVariable Long id) {
        BillResponse response = billingService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Invoice retrieved"));
    }

    @GetMapping("/bills/admission/{admissionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<BillResponse>> getBillByAdmissionId(@PathVariable Long admissionId) {
        BillResponse response = billingService.getBillByAdmissionId(admissionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/bills/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getBillsByPatient(@PathVariable Long patientId) {
        List<BillResponse> responses = billingService.getBillsByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/patient/{patientId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientBillingSummaryResponse>> getPatientBillingSummary(@PathVariable Long patientId) {
        PatientBillingSummaryResponse response = billingService.getPatientBillingSummary(patientId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/bills")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PagedResponse<BillResponse>>> getAllBills(
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "billDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<BillResponse> response = billingService.getAllBills(paymentStatus, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
