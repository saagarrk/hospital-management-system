package com.hospital.management.dto.patient;

import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientHistorySummaryResponse {

    // Patient Demographics Header
    private Long patientId;
    private String patientCode;
    private String patientName;
    private Integer age;
    private Gender gender;
    private String bloodGroup;
    private String phone;
    private String email;
    private PatientStatus status;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelation;
    private String allergies;
    private String chronicConditions;

    // High Level Summary Metrics
    private int totalAppointments;
    private int totalMedicalRecords;
    private int totalPrescriptions;
    private int totalAdmissions;

    // Detailed Clinical Timelines
    private List<AppointmentSummaryItem> recentAppointments;
    private List<MedicalRecordSummaryItem> recentClinicalRecords;
    private List<PrescriptionSummaryItem> recentPrescriptions;
    private List<AdmissionSummaryItem> recentHospitalAdmissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentSummaryItem {
        private Long id;
        private LocalDate date;
        private String time;
        private String doctorName;
        private String department;
        private String reason;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicalRecordSummaryItem {
        private Long id;
        private LocalDate visitDate;
        private String doctorName;
        private String diagnosis;
        private String symptoms;
        private String treatment;
        private String bloodPressure;
        private Integer heartRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionSummaryItem {
        private Long id;
        private LocalDate date;
        private String doctorName;
        private int medicationCount;
        private String status;
        private List<String> medicineNames;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdmissionSummaryItem {
        private Long id;
        private String admissionDate;
        private String dischargeDate;
        private String roomNumber;
        private String bedNumber;
        private String attendingDoctor;
        private String status;
    }
}
