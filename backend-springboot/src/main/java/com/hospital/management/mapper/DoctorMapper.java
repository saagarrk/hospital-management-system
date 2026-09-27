package com.hospital.management.mapper;

import com.hospital.management.dto.doctor.DoctorRequest;
import com.hospital.management.dto.doctor.DoctorResponse;
import com.hospital.management.entity.Department;
import com.hospital.management.entity.Doctor;
import org.springframework.stereotype.Component;

@Component
public class DoctorMapper {

    public Doctor toEntity(DoctorRequest request, Department department) {
        if (request == null) return null;
        return Doctor.builder()
                .name(request.getName())
                .department(department)
                .specialization(request.getSpecialization())
                .qualification(request.getQualification())
                .phone(request.getPhone())
                .email(request.getEmail())
                .roomNumber(request.getRoomNumber())
                .consultationFee(request.getConsultationFee())
                .availableDays(request.getAvailableDays())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();
    }

    public DoctorResponse toResponse(Doctor doctor) {
        if (doctor == null) return null;
        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .departmentId(doctor.getDepartment() != null ? doctor.getDepartment().getId() : null)
                .departmentName(doctor.getDepartment() != null ? doctor.getDepartment().getName() : null)
                .specialization(doctor.getSpecialization())
                .qualification(doctor.getQualification())
                .phone(doctor.getPhone())
                .email(doctor.getEmail())
                .roomNumber(doctor.getRoomNumber())
                .consultationFee(doctor.getConsultationFee())
                .availableDays(doctor.getAvailableDays())
                .startTime(doctor.getStartTime())
                .endTime(doctor.getEndTime())
                .userId(doctor.getUser() != null ? doctor.getUser().getId() : null)
                .build();
    }
}
