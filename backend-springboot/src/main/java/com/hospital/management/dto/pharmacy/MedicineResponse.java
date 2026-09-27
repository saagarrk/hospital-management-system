package com.hospital.management.dto.pharmacy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineResponse {
    private Long id;
    private String name;
    private String genericName;
    private String category;
    private String batchNumber;
    private Integer stockQuantity;
    private Integer minStockAlert;
    private BigDecimal unitPrice;
    private LocalDate expiryDate;
    private String manufacturer;
    private String status;
    private boolean isExpired;
}
