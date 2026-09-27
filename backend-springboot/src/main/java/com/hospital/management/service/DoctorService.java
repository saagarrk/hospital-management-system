package com.hospital.management.service;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.doctor.DoctorRequest;
import com.hospital.management.dto.doctor.DoctorResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DoctorService {
    DoctorResponse createDoctor(DoctorRequest request);
    DoctorResponse updateDoctor(Long id, DoctorRequest request);
    DoctorResponse getDoctorById(Long id);
    List<DoctorResponse> getDoctorsByDepartment(Long departmentId);
    PagedResponse<DoctorResponse> searchDoctors(Long departmentId, String query, Pageable pageable);
}
