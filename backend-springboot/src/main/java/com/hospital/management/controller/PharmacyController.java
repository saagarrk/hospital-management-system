package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.pharmacy.*;
import com.hospital.management.service.PharmacyService;
import com.hospital.management.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "Pharmacy", description = "Inventory tracking, medicine batch expiration monitoring, stock reorders, and stock transactions")
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
    @Operation(summary = "Add new medicine batch", description = "Catalogs medicine batch with generic name, strength, expiry date, reorder threshold, and unit price.")
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
    @Operation(summary = "Get medicine by ID", description = "Retrieves medicine batch details and real-time inventory quantity.")
    @GetMapping("/medicines/{id}")
    public ResponseEntity<ApiResponse<MedicineResponse>> getMedicineById(@PathVariable Long id) {
        MedicineResponse response = pharmacyService.getMedicineById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update medicine information (batch, price, formulation, expiry, alert thresholds).
     * Enforces SRS Rule 5: Only Pharmacists & Admins.
     */
    @Operation(summary = "Update medicine details", description = "Modifies pricing, manufacturer, or minimum stock alert thresholds.")
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
    @Operation(summary = "Decommission medicine batch", description = "Removes medicine record from catalog with regulatory compliance.")
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
    @Operation(summary = "Search medicines with pagination", description = "Multi-criteria search by keyword, pharmaceutical category, or status with Pageable.")
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
    @Operation(summary = "Restock or adjust inventory", description = "Applies stock increments or inventory adjustments with pessimistic locking and ledger audits.")
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
    @Operation(summary = "Counter dispensing", description = "Dispenses OTC or hospital supplies, ensuring non-expired status and stock decrements.")
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
    @Operation(summary = "Issue medicines against prescription", description = "Atomically validates expiry, deducts stock for all prescription items, and updates Rx status.")
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
    @Operation(summary = "Get inventory transaction ledger", description = "Retrieves paginated ledger of all stock purchases, dispensations, and adjustments.")
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
    @Operation(summary = "Get medicine stock history", description = "Retrieves ledger history for specific medicine batch.")
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
    @Operation(summary = "Get low stock alerts", description = "Lists medicines whose stock levels have dipped below configured alert thresholds.")
    @GetMapping("/alerts/low-stock")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getLowStockAlerts() {
        List<MedicineResponse> responses = pharmacyService.getLowStockAlerts();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Get expired medications quarantined by Rule 12 safety lockout.
     */
    @Operation(summary = "Get expired medicine alerts", description = "Quarantined list of medications past expiry date locked from dispensation.")
    @GetMapping("/alerts/expired")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getExpiredMedicines() {
        List<MedicineResponse> responses = pharmacyService.getExpiredMedicines();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Get pharmacy dashboard summary and inventory valuation.
     */
    @Operation(summary = "Get pharmacy inventory metrics", description = "Calculates total stock count, stock valuation, low stock items, and expired batch count.")
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PharmacySummaryDTO>> getPharmacySummary() {
        PharmacySummaryDTO summary = pharmacyService.getPharmacySummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
