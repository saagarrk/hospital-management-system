package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.pharmacy.*;
import com.hospital.management.service.PharmacyService;
import com.hospital.management.util.SecurityUtils;
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
@RequestMapping("/api/pharmacy")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyService pharmacyService;

    // =========================================================================
    // 1. MEDICINE CATALOG CRUD
    // =========================================================================

    /**
     * Catalog a new medicine batch.
     * Enforces SRS Rule 5: Only Pharmacists & Admins.
     */
    @PostMapping("/medicines")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicineResponse>> addMedicine(@Valid @RequestBody MedicineRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("pharmacist");
        MedicineResponse response = pharmacyService.addMedicine(request, username);
        return new ResponseEntity<>(ApiResponse.created(response, "Medicine batch cataloged successfully"), HttpStatus.CREATED);
    }

    /**
     * Retrieve single medicine details.
     */
    @GetMapping("/medicines/{id}")
    public ResponseEntity<ApiResponse<MedicineResponse>> getMedicineById(@PathVariable Long id) {
        MedicineResponse response = pharmacyService.getMedicineById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update medicine information (batch, price, formulation, expiry, alert thresholds).
     * Enforces SRS Rule 5: Only Pharmacists & Admins.
     */
    @PutMapping("/medicines/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicineResponse>> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody MedicineRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("pharmacist");
        MedicineResponse response = pharmacyService.updateMedicine(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Medicine catalog updated successfully"));
    }

    /**
     * Delete / decommission medicine.
     * Enforces SRS Rule 5: Only Pharmacists & Admins.
     */
    @DeleteMapping("/medicines/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUsername().orElse("pharmacist");
        pharmacyService.deleteMedicine(id, username);
        return ResponseEntity.ok(ApiResponse.success(null, "Medicine decommissioned successfully"));
    }

    /**
     * Search and list medicines with pagination, category filter, and status filter.
     */
    @GetMapping("/medicines")
    public ResponseEntity<ApiResponse<PagedResponse<MedicineResponse>>> searchMedicines(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<MedicineResponse> response = pharmacyService.searchMedicines(search, category, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // 2. STOCK MANAGEMENT & DISPENSING
    // =========================================================================

    /**
     * Adjust or restock medicine inventory.
     * Uses pessimistic write locking and records an immutable inventory transaction.
     * Enforces SRS Rule 5: Only Pharmacists & Admins.
     */
    @PatchMapping("/medicines/{id}/stock")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicineResponse>> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody StockUpdateRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("pharmacist");
        MedicineResponse response = pharmacyService.adjustStock(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Inventory batch updated successfully"));
    }

    /**
     * Dispense single medicine directly at counter.
     * Enforces SRS Rule 5 (Role) and SRS Rule 10/12 (Expired medicines locked).
     */
    @PostMapping("/medicines/{id}/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicineResponse>> dispenseMedicine(
            @PathVariable Long id,
            @Valid @RequestBody DispenseRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("pharmacist");
        MedicineResponse response = pharmacyService.dispenseMedicine(id, request.getQuantity(), request.getNotes(), username);
        return ResponseEntity.ok(ApiResponse.success(response, "Medicine safely dispensed"));
    }

    /**
     * Issue medicines against a prescription.
     * Atomically locks medicine inventory rows using pessimistic write locking,
     * verifies expiry and stock quantities, deducts inventory, records audit logs,
     * and marks the prescription as DISPENSED.
     */
    @PostMapping("/prescriptions/{id}/issue")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<IssuePrescriptionResponse>> issueAgainstPrescription(
            @PathVariable Long id,
            @RequestBody(required = false) IssuePrescriptionRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("pharmacist");
        if (request == null) {
            request = new IssuePrescriptionRequest();
        }
        request.setPrescriptionId(id);
        IssuePrescriptionResponse response = pharmacyService.issueAgainstPrescription(request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Prescription medicines safely issued and inventory deducted."));
    }

    // =========================================================================
    // 3. INVENTORY HISTORY & AUDIT TRAIL
    // =========================================================================

    /**
     * Retrieve complete pharmacy inventory movement audit trail.
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<InventoryTransactionDTO>>> getAllInventoryHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<InventoryTransactionDTO> response = pharmacyService.getAllInventoryHistory(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieve inventory movement history for a specific medicine.
     */
    @GetMapping("/medicines/{id}/history")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<InventoryTransactionDTO>>> getMedicineInventoryHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<InventoryTransactionDTO> response = pharmacyService.getInventoryHistory(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // 4. ALERTS & METRICS
    // =========================================================================

    /**
     * Get real-time low stock alerts.
     */
    @GetMapping("/alerts/low-stock")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getLowStockAlerts() {
        List<MedicineResponse> responses = pharmacyService.getLowStockAlerts();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Get expired medications quarantined by Rule 12 safety lockout.
     */
    @GetMapping("/alerts/expired")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getExpiredMedicines() {
        List<MedicineResponse> responses = pharmacyService.getExpiredMedicines();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Get pharmacy dashboard summary and inventory valuation.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PharmacySummaryDTO>> getPharmacySummary() {
        PharmacySummaryDTO summary = pharmacyService.getPharmacySummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
