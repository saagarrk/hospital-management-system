package com.hospital.management.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Response payload for Doctor Availability checks (Feature: Check doctor availability).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAvailabilityResponse {
    private Long doctorId;
    private String doctorName;
    private String specialization;
    private String departmentName;
    private LocalDate checkDate;
    private String dayOfWeek;
    private boolean isWorkingDay;
    private String doctorScheduleDays;
    private LocalTime startTime;
    private LocalTime endTime;
    private int slotDurationMinutes;
    private int totalSlots;
    private int availableSlotsCount;
    private int bookedSlotsCount;
    private List<TimeSlotDto> slots;
    private String statusMessage;
}
