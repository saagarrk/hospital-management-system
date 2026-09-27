package com.hospital.management.dto.admission;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotBlank(message = "Room type is required (e.g. ICU, GENERAL_WARD, SEMI_PRIVATE, PRIVATE_AC)")
    private String roomType;

    private String floor;

    private Long departmentId;

    @NotNull(message = "Daily rate is required")
    @DecimalMin(value = "0.0", message = "Daily rate must be non-negative")
    private BigDecimal dailyRate;

    private Integer capacity;

    private String status;
}
