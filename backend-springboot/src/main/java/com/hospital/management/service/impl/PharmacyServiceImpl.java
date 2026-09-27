package com.hospital.management.service.impl;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.pharmacy.*;
import com.hospital.management.entity.InventoryTransaction;
import com.hospital.management.entity.Medicine;
import com.hospital.management.entity.Prescription;
import com.hospital.management.entity.PrescriptionItem;
import com.hospital.management.entity.User;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.InventoryTransactionMapper;
import com.hospital.management.mapper.MedicineMapper;
import com.hospital.management.mapper.PrescriptionMapper;
import com.hospital.management.repository.InventoryTransactionRepository;
import com.hospital.management.repository.MedicineRepository;
import com.hospital.management.repository.PrescriptionRepository;
import com.hospital.management.repository.UserRepository;
import com.hospital.management.service.PharmacyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Enterprise Pharmacy and Inventory Service.
 *
 * Implements:
 * 1. SRS Rule 5: Strict Role Authorization (Only Pharmacists / Admins can modify inventory).
 * 2. SRS Rule 10 / 12: Expiry Safety Guard (Expired drugs can NEVER be dispensed).
 * 3. Concurrency Protection: Uses Pessimistic Write Locking (findByIdForUpdate)
 *    during issuance and inventory adjustments to serialize concurrent checkout requests,
 *    preventing double-spend and race conditions that could lead to negative stock.
 * 4. Full Audit Trail: Records every stock movement in InventoryTransaction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PharmacyServiceImpl implements PharmacyService {

    private final MedicineRepository medicineRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final MedicineMapper medicineMapper;
    private final InventoryTransactionMapper inventoryTransactionMapper;
    private final PrescriptionMapper prescriptionMapper;
    private final com.hospital.management.service.AuditLogService auditLogService;

    // =========================================================================
    // 1. MEDICINE CRUD
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MedicineResponse addMedicine(MedicineRequest request, String username) {
        verifyPharmacistAuthority(username, "create medicine catalog entries");

        // Validate batch information
        if (request.getBatchNumber() == null || request.getBatchNumber().trim().isEmpty()) {
            throw new BusinessRuleException("Batch number is required and cannot be empty.", HttpStatus.BAD_REQUEST);
        }

        // Validate expiry date: new stock cannot be already expired
        if (request.getExpiryDate() == null || request.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BusinessRuleException(
                    "Expiry date is invalid. Newly cataloged inventory must have a future expiration date.",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Validate price and quantities
        if (request.getUnitPrice() == null || request.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Unit price must be strictly positive.", HttpStatus.BAD_REQUEST);
        }

        if (request.getStockQuantity() == null || request.getStockQuantity() < 0) {
            throw new BusinessRuleException("Initial stock quantity cannot be negative.", HttpStatus.BAD_REQUEST);
        }

        Medicine medicine = medicineMapper.toEntity(request);
        if (medicine.getStockQuantity() == 0) {
            medicine.setStatus("OUT_OF_STOCK");
        } else if (medicine.getStockQuantity() <= medicine.getMinStockAlert()) {
            medicine.setStatus("LOW_STOCK");
        } else {
            medicine.setStatus("AVAILABLE");
        }

        Medicine saved = medicineRepository.save(medicine);

        // Record initial inventory transaction if quantity > 0
        if (saved.getStockQuantity() > 0) {
            recordTransaction(
                    saved,
                    "INITIAL_STOCK",
                    saved.getStockQuantity(),
                    0,
                    saved.getStockQuantity(),
                    "MANUAL_CATALOG",
                    saved.getId(),
                    "Initial stock cataloged for batch " + saved.getBatchNumber(),
                    username,
                    "PHARMACIST"
            );
        }

        log.info("Medicine '{}' (Batch {}) created by {}", saved.getName(), saved.getBatchNumber(), username);
        return medicineMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineResponse getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
        return medicineMapper.toResponse(medicine);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MedicineResponse updateMedicine(Long id, MedicineRequest request, String username) {
        verifyPharmacistAuthority(username, "update medicine catalog entries");

        // Use pessimistic lock to prevent concurrent modifications
        Medicine medicine = medicineRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        // Validate batch and expiry
        if (request.getBatchNumber() == null || request.getBatchNumber().trim().isEmpty()) {
            throw new BusinessRuleException("Batch number is required.", HttpStatus.BAD_REQUEST);
        }

        if (request.getExpiryDate() == null) {
            throw new BusinessRuleException("Expiry date is required.", HttpStatus.BAD_REQUEST);
        }

        if (request.getUnitPrice() == null || request.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Unit price must be strictly positive.", HttpStatus.BAD_REQUEST);
        }

        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName() != null ? request.getGenericName().trim() : "");
        medicine.setCategory(request.getCategory().trim());
        medicine.setBatchNumber(request.getBatchNumber().trim());
        medicine.setUnitPrice(request.getUnitPrice());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setMinStockAlert(request.getMinStockAlert());
        medicine.setManufacturer(request.getManufacturer());

        // Update status based on current stock & expiry
        if (medicine.isExpired()) {
            medicine.setStatus("EXPIRED");
        } else if (medicine.getStockQuantity() == 0) {
            medicine.setStatus("OUT_OF_STOCK");
        } else if (medicine.getStockQuantity() <= medicine.getMinStockAlert()) {
            medicine.setStatus("LOW_STOCK");
        } else {
            medicine.setStatus("AVAILABLE");
        }

        Medicine updated = medicineRepository.save(medicine);
        log.info("Medicine '{}' (id={}) updated by {}", updated.getName(), updated.getId(), username);
        return medicineMapper.toResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteMedicine(Long id, String username) {
        verifyPharmacistAuthority(username, "delete medicine entries");

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        if (medicine.getStockQuantity() > 0) {
            throw new BusinessRuleException(
                    String.format("Cannot delete medicine '%s' because there are still %d units in stock. Please write off or dispose of inventory first.",
                            medicine.getName(), medicine.getStockQuantity()),
                    HttpStatus.CONFLICT
            );
        }

        medicineRepository.delete(medicine);
        log.info("Medicine id={} deleted by {}", id, username);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<MedicineResponse> searchMedicines(String query, String category, String status, Pageable pageable) {
        Page<Medicine> page;
        if (query != null && !query.trim().isEmpty()) {
            page = medicineRepository.searchMedicines(query.trim(), pageable);
        } else {
            page = medicineRepository.findAll(pageable);
        }

        List<MedicineResponse> content = page.getContent().stream()
                .filter(m -> category == null || category.trim().isEmpty() || category.equalsIgnoreCase("ALL") || m.getCategory().equalsIgnoreCase(category))
                .filter(m -> status == null || status.trim().isEmpty() || status.equalsIgnoreCase("ALL") || m.getStatus().equalsIgnoreCase(status))
                .map(medicineMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<MedicineResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // =========================================================================
    // 2. STOCK MANAGEMENT WITH PESSIMISTIC LOCKING & AUDIT TRAIL
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MedicineResponse updateStock(Long medicineId, int quantityChange, String reason, String username) {
        verifyPharmacistAuthority(username, "update pharmacy stock");

        // PESSIMISTIC WRITE LOCK: Serializes concurrent stock adjustments
        Medicine medicine = medicineRepository.findByIdForUpdate(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + medicineId));

        int previousStock = medicine.getStockQuantity();
        int newStock = previousStock + quantityChange;

        // Business Rule: Quantity cannot become negative
        if (newStock < 0) {
            throw new BusinessRuleException(
                    String.format("Stock quantity cannot become negative. Current: %d, Change: %d, Result: %d",
                            previousStock, quantityChange, newStock),
                    HttpStatus.BAD_REQUEST
            );
        }

        medicine.setStockQuantity(newStock);

        if (medicine.isExpired()) {
            medicine.setStatus("EXPIRED");
        } else if (newStock == 0) {
            medicine.setStatus("OUT_OF_STOCK");
        } else if (newStock <= medicine.getMinStockAlert()) {
            medicine.setStatus("LOW_STOCK");
        } else {
            medicine.setStatus("AVAILABLE");
        }

        Medicine saved = medicineRepository.save(medicine);

        // Record stock transaction history
        String txType = quantityChange >= 0 ? "STOCK_IN" : "ADJUSTMENT";
        recordTransaction(
                saved,
                txType,
                quantityChange,
                previousStock,
                newStock,
                "MANUAL_ADJUSTMENT",
                saved.getId(),
                reason != null ? reason : (quantityChange >= 0 ? "Manual restock" : "Inventory adjustment"),
                username,
                "PHARMACIST"
        );

        auditLogService.recordEvent(
                username,
                "PHARMACIST",
                "MEDICINE_STOCK_CHANGED",
                "MEDICINE",
                saved.getId(),
                "SUCCESS",
                String.format("Adjusted stock for '%s' (Batch: %s): %d -> %d (Change: %+d). Reason: %s",
                        saved.getName(), saved.getBatchNumber(), previousStock, newStock, quantityChange, reason)
        );

        log.info("Stock updated for '{}': {} -> {} ({}) by {}", saved.getName(), previousStock, newStock, quantityChange, username);
        return medicineMapper.toResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MedicineResponse adjustStock(Long medicineId, StockUpdateRequest request, String username) {
        return updateStock(medicineId, request.getQuantityChange(), request.getReason(), username);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MedicineResponse dispenseMedicine(Long medicineId, int quantity, String notes, String username) {
        verifyPharmacistAuthority(username, "dispense medications");

        if (quantity <= 0) {
            throw new BusinessRuleException("Dispense quantity must be at least 1 unit.", HttpStatus.BAD_REQUEST);
        }

        // PESSIMISTIC WRITE LOCK (SELECT FOR UPDATE)
        Medicine medicine = medicineRepository.findByIdForUpdate(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + medicineId));

        // Business Rule 10/12: Expired medicines must never be issued
        if (medicine.isExpired()) {
            throw new BusinessRuleException(
                    String.format("Safety Lockout (Rule 12): Medicine '%s' (Batch: %s) expired on %s and CANNOT be dispensed.",
                            medicine.getName(), medicine.getBatchNumber(), medicine.getExpiryDate()),
                    HttpStatus.CONFLICT
            );
        }

        // Business Rule: Prevent issuing more than available stock
        if (medicine.getStockQuantity() < quantity) {
            throw new BusinessRuleException(
                    String.format("Insufficient stock for '%s'. Available: %d, Requested: %d",
                            medicine.getName(), medicine.getStockQuantity(), quantity),
                    HttpStatus.BAD_REQUEST
            );
        }

        int previousStock = medicine.getStockQuantity();
        int newStock = previousStock - quantity;
        medicine.setStockQuantity(newStock);

        if (newStock == 0) {
            medicine.setStatus("OUT_OF_STOCK");
        } else if (newStock <= medicine.getMinStockAlert()) {
            medicine.setStatus("LOW_STOCK");
        }

        Medicine saved = medicineRepository.save(medicine);

        recordTransaction(
                saved,
                "DISPENSED",
                -quantity,
                previousStock,
                newStock,
                "DIRECT_DISPENSE",
                saved.getId(),
                notes != null ? notes : "Direct patient dispensation at pharmacy counter",
                username,
                "PHARMACIST"
        );

        log.info("Dispensed {} units of '{}' (Remaining: {}) by {}", quantity, saved.getName(), newStock, username);
        return medicineMapper.toResponse(saved);
    }

    // =========================================================================
    // 3. ISSUE MEDICINES AGAINST PRESCRIPTION (TRANSACTIONAL & CONCURRENCY SAFE)
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public IssuePrescriptionResponse issueAgainstPrescription(IssuePrescriptionRequest request, String pharmacistUsername) {
        verifyPharmacistAuthority(pharmacistUsername, "issue medicines against prescriptions");

        Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + request.getPrescriptionId()));

        if ("DISPENSED".equalsIgnoreCase(prescription.getStatus())) {
            throw new BusinessRuleException(
                    String.format("Prescription #%d has already been dispensed on %s by %s.",
                            prescription.getId(), prescription.getDispensedAt(), prescription.getDispensedBy()),
                    HttpStatus.BAD_REQUEST
            );
        }

        if ("CANCELLED".equalsIgnoreCase(prescription.getStatus())) {
            throw new BusinessRuleException(
                    String.format("Prescription #%d is cancelled and cannot be dispensed.", prescription.getId()),
                    HttpStatus.BAD_REQUEST
            );
        }

        if (prescription.getItems() == null || prescription.getItems().isEmpty()) {
            throw new BusinessRuleException("Prescription contains no medication items to issue.", HttpStatus.BAD_REQUEST);
        }

        List<IssuePrescriptionResponse.IssuedMedicineItem> issuedItems = new ArrayList<>();

        // Loop over each prescribed item and deduct inventory with PESSIMISTIC LOCKING
        for (PrescriptionItem item : prescription.getItems()) {
            Medicine med = item.getMedicine();
            if (med == null) continue;

            // PESSIMISTIC LOCKING: Acquires database row lock on medicine
            Medicine lockedMed = medicineRepository.findByIdForUpdate(med.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + med.getId()));

            // 1. Expiry Check
            if (lockedMed.isExpired()) {
                throw new BusinessRuleException(
                        String.format("Safety Violation (Rule 12): Medicine '%s' (Batch: %s) expired on %s and cannot be issued for Prescription #%d.",
                                lockedMed.getName(), lockedMed.getBatchNumber(), lockedMed.getExpiryDate(), prescription.getId()),
                        HttpStatus.CONFLICT
                );
            }

            // Standard quantity per prescription item line (default 1 unit/pack if not custom specified)
            int quantityToDeduct = 1;
            if (request.getItems() != null) {
                for (IssuePrescriptionRequest.ItemToIssue customItem : request.getItems()) {
                    if (customItem.getMedicineId() != null && customItem.getMedicineId().equals(lockedMed.getId())) {
                        if (customItem.getQuantity() != null && customItem.getQuantity() > 0) {
                            quantityToDeduct = customItem.getQuantity();
                        }
                    }
                }
            }

            // 2. Prevent issuing more than available stock
            if (lockedMed.getStockQuantity() < quantityToDeduct) {
                throw new BusinessRuleException(
                        String.format("Insufficient stock for '%s' (Batch: %s). Requested: %d, Available: %d. Cannot complete issuance for Prescription #%d.",
                                lockedMed.getName(), lockedMed.getBatchNumber(), quantityToDeduct, lockedMed.getStockQuantity(), prescription.getId()),
                        HttpStatus.BAD_REQUEST
                );
            }

            // 3. Deduct stock atomically
            int prevStock = lockedMed.getStockQuantity();
            int newStock = prevStock - quantityToDeduct;
            lockedMed.setStockQuantity(newStock);

            if (newStock == 0) {
                lockedMed.setStatus("OUT_OF_STOCK");
            } else if (newStock <= lockedMed.getMinStockAlert()) {
                lockedMed.setStatus("LOW_STOCK");
            }

            Medicine savedMed = medicineRepository.save(lockedMed);

            // 4. Create immutable inventory movement record
            recordTransaction(
                    savedMed,
                    "DISPENSED",
                    -quantityToDeduct,
                    prevStock,
                    newStock,
                    "PRESCRIPTION",
                    prescription.getId(),
                    String.format("Dispensed against Prescription #%d for patient %s", prescription.getId(), prescription.getPatient().getName()),
                    pharmacistUsername,
                    "PHARMACIST"
            );

            issuedItems.add(IssuePrescriptionResponse.IssuedMedicineItem.builder()
                    .medicineId(savedMed.getId())
                    .medicineName(savedMed.getName())
                    .batchNumber(savedMed.getBatchNumber())
                    .quantityIssued(quantityToDeduct)
                    .remainingStock(newStock)
                    .status(savedMed.getStatus())
                    .build());
        }

        // 5. Update Prescription Status
        prescription.setStatus("DISPENSED");
        prescription.setDispensedAt(LocalDateTime.now());
        prescription.setDispensedBy(pharmacistUsername != null ? pharmacistUsername : "Staff Pharmacist");
        prescription.setDispensingNotes(request.getDispensingNotes() != null && !request.getDispensingNotes().trim().isEmpty()
                ? request.getDispensingNotes().trim()
                : "Medicines issued against clinical order with batch verification.");

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        log.info("Prescription #{} successfully issued by {} with {} items deducted",
                savedPrescription.getId(), pharmacistUsername, issuedItems.size());

        return IssuePrescriptionResponse.builder()
                .prescriptionId(savedPrescription.getId())
                .status("DISPENSED")
                .dispensedBy(savedPrescription.getDispensedBy())
                .dispensedAt(savedPrescription.getDispensedAt())
                .dispensingNotes(savedPrescription.getDispensingNotes())
                .issuedItems(issuedItems)
                .prescription(prescriptionMapper.toResponse(savedPrescription))
                .build();
    }

    // =========================================================================
    // 4. INVENTORY HISTORY & MOVEMENT
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<InventoryTransactionDTO> getInventoryHistory(Long medicineId, Pageable pageable) {
        Page<InventoryTransaction> page = inventoryTransactionRepository.findByMedicineIdOrderByCreatedAtDesc(medicineId, pageable);
        List<InventoryTransactionDTO> content = page.getContent().stream()
                .map(inventoryTransactionMapper::toDTO)
                .collect(Collectors.toList());

        return PagedResponse.<InventoryTransactionDTO>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<InventoryTransactionDTO> getAllInventoryHistory(Pageable pageable) {
        Page<InventoryTransaction> page = inventoryTransactionRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<InventoryTransactionDTO> content = page.getContent().stream()
                .map(inventoryTransactionMapper::toDTO)
                .collect(Collectors.toList());

        return PagedResponse.<InventoryTransactionDTO>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // =========================================================================
    // 5. ALERTS & SUMMARY
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<MedicineResponse> getLowStockAlerts() {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getStockQuantity() <= m.getMinStockAlert() && !m.isExpired())
                .map(medicineMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineResponse> getExpiredMedicines() {
        return medicineRepository.findAll().stream()
                .filter(Medicine::isExpired)
                .map(medicineMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacySummaryDTO getPharmacySummary() {
        List<Medicine> all = medicineRepository.findAll();
        long total = all.size();
        long expired = all.stream().filter(Medicine::isExpired).count();
        long outOfStock = all.stream().filter(m -> !m.isExpired() && m.getStockQuantity() == 0).count();
        long lowStock = all.stream().filter(m -> !m.isExpired() && m.getStockQuantity() > 0 && m.getStockQuantity() <= m.getMinStockAlert()).count();
        long available = all.stream().filter(m -> !m.isExpired() && m.getStockQuantity() > m.getMinStockAlert()).count();

        BigDecimal totalVal = all.stream()
                .map(m -> m.getUnitPrice().multiply(BigDecimal.valueOf(m.getStockQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingRx = prescriptionRepository.findAll().stream()
                .filter(p -> "ISSUED".equalsIgnoreCase(p.getStatus()))
                .count();

        return PharmacySummaryDTO.builder()
                .totalMedicines(total)
                .availableMedicines(available)
                .lowStockCount(lowStock)
                .expiredCount(expired)
                .outOfStockCount(outOfStock)
                .totalInventoryValue(totalVal)
                .pendingPrescriptionsCount(pendingRx)
                .build();
    }

    // =========================================================================
    // HELPERS & SECURITY VALIDATION
    // =========================================================================

    private void recordTransaction(
            Medicine medicine,
            String type,
            int quantityChange,
            int previousStock,
            int newStock,
            String refType,
            Long refId,
            String reason,
            String performedBy,
            String role
    ) {
        InventoryTransaction tx = InventoryTransaction.builder()
                .medicine(medicine)
                .medicineName(medicine.getName())
                .batchNumber(medicine.getBatchNumber())
                .transactionType(type)
                .quantityChange(quantityChange)
                .previousStock(previousStock)
                .newStock(newStock)
                .referenceType(refType)
                .referenceId(refId)
                .reason(reason)
                .performedBy(performedBy != null ? performedBy : "system_pharmacist")
                .performedByRole(role != null ? role : "PHARMACIST")
                .createdAt(LocalDateTime.now())
                .build();

        inventoryTransactionRepository.save(tx);
    }

    private void verifyPharmacistAuthority(String username, String actionDescription) {
        if (username == null || username.trim().isEmpty()) return;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            Role role = user.getRole();
            if (role != Role.PHARMACIST && role != Role.ADMIN) {
                throw new UnauthorizedActionException(
                        String.format("SRS Rule 5 Violation: User role '%s' is not authorized to %s. Only licensed pharmacists and administrators have inventory management clearance.",
                                role, actionDescription)
                );
            }
        }
    }
}
