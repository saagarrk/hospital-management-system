package com.hospital.management.service;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.pharmacy.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PharmacyService {

    // Medicine CRUD
    MedicineResponse addMedicine(MedicineRequest request, String username);
    MedicineResponse getMedicineById(Long id);
    MedicineResponse updateMedicine(Long id, MedicineRequest request, String username);
    void deleteMedicine(Long id, String username);
    PagedResponse<MedicineResponse> searchMedicines(String query, String category, String status, Pageable pageable);

    // Stock Management with pessimistic concurrency control
    MedicineResponse updateStock(Long medicineId, int quantityChange, String reason, String username);
    MedicineResponse adjustStock(Long medicineId, StockUpdateRequest request, String username);
    MedicineResponse dispenseMedicine(Long medicineId, int quantity, String notes, String username);

    // Issuance against Prescriptions with transaction & pessimistic locking
    IssuePrescriptionResponse issueAgainstPrescription(IssuePrescriptionRequest request, String pharmacistUsername);

    // Inventory History & Audit Tracking
    PagedResponse<InventoryTransactionDTO> getInventoryHistory(Long medicineId, Pageable pageable);
    PagedResponse<InventoryTransactionDTO> getAllInventoryHistory(Pageable pageable);

    // Alerts & Summaries
    List<MedicineResponse> getLowStockAlerts();
    List<MedicineResponse> getExpiredMedicines();
    PharmacySummaryDTO getPharmacySummary();
}
