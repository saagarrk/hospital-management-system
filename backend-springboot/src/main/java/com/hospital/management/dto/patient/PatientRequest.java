package com.hospital.management.dto.patient;

import com.hospital.management.enums.BloodGroup;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.MaritalStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequest {

    @NotBlank(message = "Patient full legal name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be a past date")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    private MaritalStatus maritalStatus;

    @Size(max = 100, message = "Occupation cannot exceed 100 characters")
    private String occupation;

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "^\\+?[0-9. ()-]{7,25}$",
        message = "Mobile number must be a valid international or local phone format (7-25 digits)"
    )
    private String phone;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @NotBlank(message = "Emergency contact name is required")
    @Size(min = 2, max = 100, message = "Emergency contact name must be between 2 and 100 characters")
    private String emergencyContactName;

    @NotBlank(message = "Emergency contact phone is required")
    @Pattern(
        regexp = "^\\+?[0-9. ()-]{7,25}$",
        message = "Emergency contact phone must be a valid phone number"
    )
    private String emergencyContactPhone;

    @Size(max = 50, message = "Emergency contact relation cannot exceed 50 characters")
    private String emergencyContactRelation;

    private String medicalHistory;

    private String allergies;

    private Long userId; // Optional linkage to user credentials for patient self-service portal
}
