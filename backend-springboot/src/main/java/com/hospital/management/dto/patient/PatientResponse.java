package com.hospital.management.dto.patient;

import com.hospital.management.enums.Gender;
import com.hospital.management.enums.MaritalStatus;
import com.hospital.management.enums.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {
    private Long id;
    private String patientCode;
    private String name;
    private LocalDate dateOfBirth;
    private Integer age;
    private Gender gender;
    private String bloodGroup;
    private MaritalStatus maritalStatus;
    private String occupation;
    private String phone;
    private String email;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelation;
    private String medicalHistory;
    private String allergies;
    private PatientStatus status;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
