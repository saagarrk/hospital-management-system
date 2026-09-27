package com.hospital.management.dto.appointment;

import com.hospital.management.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating appointment status (Confirm, Cancel, Complete).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatusUpdateRequest {

    @NotNull(message = "Target appointment status is required")
    private AppointmentStatus status;

    @Size(max = 255, message = "Reason notes cannot exceed 255 characters")
    private String reason;

    @Size(max = 1000, message = "Clinical notes cannot exceed 1000 characters")
    private String notes;
}
