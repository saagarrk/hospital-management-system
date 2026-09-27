package com.hospital.management.repository;

import com.hospital.management.entity.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientId(Long patientId);
    List<Prescription> findByPatientIdOrderByPrescriptionDateDesc(Long patientId);
    Page<Prescription> findByPatientId(Long patientId, Pageable pageable);
    Page<Prescription> findByPatientIdOrderByPrescriptionDateDesc(Long patientId, Pageable pageable);
    List<Prescription> findByDoctorId(Long doctorId);
    List<Prescription> findByDoctorIdOrderByPrescriptionDateDesc(Long doctorId);
    List<Prescription> findByStatus(String status);
    List<Prescription> findByStatusOrderByPrescriptionDateDesc(String status);
    Page<Prescription> findByStatus(String status, Pageable pageable);
    Page<Prescription> findByStatusOrderByPrescriptionDateDesc(String status, Pageable pageable);
    long countByStatus(String status);
    long countByPatientId(Long patientId);
}
