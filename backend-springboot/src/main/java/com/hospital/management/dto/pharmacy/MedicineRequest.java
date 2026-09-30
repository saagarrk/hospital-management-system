package com.hospital.management.dto.pharmacy;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class MedicineRequest {

    @NotBlank(message = "Medicine name is required")
    private String name;

    @NotBlank(message = "Generic name is required")
    private String genericName;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stockQuantity;

    @NotNull(message = "Minimum stock alert threshold is required")
    @Min(value = 0, message = "Alert threshold cannot be negative")
    private Integer minStockAlert;

    @NotNull(message = "Unit price is required")
    @Positive(message = "Unit price must be greater than zero")
    private BigDecimal unitPrice;

    @NotNull(message = "Expiry date is required")
    @Future(message = "Medicine batch expiry date must be a future date")
    private LocalDate expiryDate;

    private String manufacturer;
}
