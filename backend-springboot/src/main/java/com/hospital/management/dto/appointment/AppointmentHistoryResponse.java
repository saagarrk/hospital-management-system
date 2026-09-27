package com.hospital.management.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Historical aggregated view of patient consultations and appointments.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentHistoryResponse {
    private Long patientId;
    private String patientName;
    private String patientCode;
    private int totalAppointments;
    private int completedAppointments;
    private int cancelledAppointments;
    private int upcomingAppointments;
    private List<AppointmentResponse> history;
}
