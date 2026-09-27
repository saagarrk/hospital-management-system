package com.hospital.management.mapper;

import com.hospital.management.dto.pharmacy.InventoryTransactionDTO;
import com.hospital.management.entity.InventoryTransaction;
import org.springframework.stereotype.Component;

@Component
public class InventoryTransactionMapper {

    public InventoryTransactionDTO toDTO(InventoryTransaction entity) {
        if (entity == null) return null;
        return InventoryTransactionDTO.builder()
                .id(entity.getId())
                .medicineId(entity.getMedicine() != null ? entity.getMedicine().getId() : null)
                .medicineName(entity.getMedicineName())
                .batchNumber(entity.getBatchNumber())
                .transactionType(entity.getTransactionType())
                .quantityChange(entity.getQuantityChange())
                .previousStock(entity.getPreviousStock())
                .newStock(entity.getNewStock())
                .referenceType(entity.getReferenceType())
                .referenceId(entity.getReferenceId())
                .reason(entity.getReason())
                .performedBy(entity.getPerformedBy())
                .performedByRole(entity.getPerformedByRole())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
