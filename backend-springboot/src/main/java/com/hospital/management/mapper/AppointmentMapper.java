package com.hospital.management.mapper;

import com.hospital.management.dto.appointment.AppointmentBookingRequest;
import com.hospital.management.dto.appointment.AppointmentResponse;
import com.hospital.management.entity.Appointment;
import com.hospital.management.entity.Doctor;
import com.hospital.management.entity.Patient;
import com.hospital.management.enums.AppointmentStatus;
import org.springframework.stereotype.Component;

/**
 * Component responsible for clean DTO-Entity translation.
 * Enforces architectural rule: "Never expose entity directly."
 */
@Component
public class AppointmentMapper {

    public Appointment toEntity(AppointmentBookingRequest request, Patient patient, Doctor doctor) {
        if (request == null) return null;
        return Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .reason(request.getReason())
                .notes(request.getNotes())
                .status(AppointmentStatus.PENDING)
                .build();
    }

    public AppointmentResponse toResponse(Appointment appointment) {
        if (appointment == null) return null;

        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(patient != null ? patient.getId() : null)
                .patientName(patient != null ? patient.getName() : "Unknown")
                .patientCode(patient != null ? patient.getPatientCode() : null)
                .patientPhone(patient != null ? patient.getPhone() : null)
                .patientEmail(patient != null ? patient.getEmail() : null)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(doctor != null ? doctor.getName() : "Unknown")
                .doctorSpecialization(doctor != null ? doctor.getSpecialization() : null)
                .departmentName(doctor != null && doctor.getDepartment() != null
                        ? doctor.getDepartment().getName()
                        : null)
                .consultationFee(doctor != null ? doctor.getConsultationFee() : null)
                .roomNumber(doctor != null ? doctor.getRoomNumber() : null)
                .appointmentDate(appointment.getAppointmentDate())
                .appointmentTime(appointment.getAppointmentTime())
                .status(appointment.getStatus())
                .reason(appointment.getReason())
                .notes(appointment.getNotes())
                .cancellationReason(appointment.getCancellationReason())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }
}
