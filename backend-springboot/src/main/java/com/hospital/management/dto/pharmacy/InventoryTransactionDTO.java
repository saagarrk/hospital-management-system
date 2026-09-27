package com.hospital.management.dto.pharmacy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionDTO {
    private Long id;
    private Long medicineId;
    private String medicineName;
    private String batchNumber;
    private String transactionType;
    private Integer quantityChange;
    private Integer previousStock;
    private Integer newStock;
    private String referenceType;
    private Long referenceId;
    private String reason;
    private String performedBy;
    private String performedByRole;
    private LocalDateTime createdAt;
}
