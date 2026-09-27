package com.hospital.management.mapper;

import com.hospital.management.dto.pharmacy.MedicineRequest;
import com.hospital.management.dto.pharmacy.MedicineResponse;
import com.hospital.management.entity.Medicine;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class MedicineMapper {

    public Medicine toEntity(MedicineRequest request) {
        if (request == null) return null;
        return Medicine.builder()
                .name(request.getName())
                .genericName(request.getGenericName())
                .category(request.getCategory())
                .batchNumber(request.getBatchNumber())
                .stockQuantity(request.getStockQuantity())
                .minStockAlert(request.getMinStockAlert())
                .unitPrice(request.getUnitPrice())
                .expiryDate(request.getExpiryDate())
                .manufacturer(request.getManufacturer())
                .status("AVAILABLE")
                .build();
    }

    public MedicineResponse toResponse(Medicine medicine) {
        if (medicine == null) return null;
        boolean isExpired = medicine.getExpiryDate() != null && medicine.getExpiryDate().isBefore(LocalDate.now());

        return MedicineResponse.builder()
                .id(medicine.getId())
                .name(medicine.getName())
                .genericName(medicine.getGenericName())
                .category(medicine.getCategory())
                .batchNumber(medicine.getBatchNumber())
                .stockQuantity(medicine.getStockQuantity())
                .minStockAlert(medicine.getMinStockAlert())
                .unitPrice(medicine.getUnitPrice())
                .expiryDate(medicine.getExpiryDate())
                .manufacturer(medicine.getManufacturer())
                .status(isExpired ? "EXPIRED" : medicine.getStatus())
                .isExpired(isExpired)
                .build();
    }
}
