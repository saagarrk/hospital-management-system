package com.hospital.management.dto.doctor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {
    private Long id;
    private String name;
    private Long departmentId;
    private String departmentName;
    private String specialization;
    private String qualification;
    private String phone;
    private String email;
    private String roomNumber;
    private BigDecimal consultationFee;
    private String availableDays;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long userId;
}
