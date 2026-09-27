package com.hospital.management.dto.patient;

import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientSummaryResponse {
    private Long id;
    private String patientCode;
    private String name;
    private Integer age;
    private Gender gender;
    private String bloodGroup;
    private String phone;
    private String email;
    private PatientStatus status;
    private boolean hasAllergies;
}
