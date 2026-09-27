package com.hospital.management.service.impl;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.doctor.DoctorRequest;
import com.hospital.management.dto.doctor.DoctorResponse;
import com.hospital.management.entity.Department;
import com.hospital.management.entity.Doctor;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.mapper.DoctorMapper;
import com.hospital.management.repository.DepartmentRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorMapper doctorMapper;

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        Doctor doctor = doctorMapper.toEntity(request, department);
        Doctor saved = doctorRepository.save(doctor);
        return doctorMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor existing = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        existing.setName(request.getName());
        existing.setDepartment(department);
        existing.setSpecialization(request.getSpecialization());
        existing.setQualification(request.getQualification());
        existing.setPhone(request.getPhone());
        existing.setEmail(request.getEmail());
        existing.setRoomNumber(request.getRoomNumber());
        existing.setConsultationFee(request.getConsultationFee());
        existing.setAvailableDays(request.getAvailableDays());
        existing.setStartTime(request.getStartTime());
        existing.setEndTime(request.getEndTime());

        Doctor updated = doctorRepository.save(existing);
        return doctorMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return doctorMapper.toResponse(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorResponse> getDoctorsByDepartment(Long departmentId) {
        return doctorRepository.findByDepartmentId(departmentId).stream()
                .map(doctorMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DoctorResponse> searchDoctors(Long departmentId, String query, Pageable pageable) {
        Page<Doctor> page;
        if (departmentId != null) {
            page = doctorRepository.findByDepartmentId(departmentId, pageable);
        } else if (query != null && !query.trim().isEmpty()) {
            page = doctorRepository.findByNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(query, query, pageable);
        } else {
            page = doctorRepository.findAll(pageable);
        }

        List<DoctorResponse> content = page.getContent().stream()
                .map(doctorMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<DoctorResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
