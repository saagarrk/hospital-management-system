package com.hospital.management.repository;

import com.hospital.management.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByVisitDateDescCreatedAtDesc(Long patientId);

    List<MedicalRecord> findByPatientId(Long patientId);

    Page<MedicalRecord> findByPatientId(Long patientId, Pageable pageable);

    Page<MedicalRecord> findByDoctorId(Long doctorId, Pageable pageable);

    @Query(
        value = "SELECT m FROM MedicalRecord m " +
                "JOIN FETCH m.patient p " +
                "JOIN FETCH m.doctor d " +
                "WHERE (:patientId IS NULL OR p.id = :patientId) " +
                "AND (:doctorId IS NULL OR d.id = :doctorId) " +
                "AND (:date IS NULL OR m.visitDate = :date) " +
                "AND (:startDate IS NULL OR m.visitDate >= :startDate) " +
                "AND (:endDate IS NULL OR m.visitDate <= :endDate) " +
                "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(m.diagnosis) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(m.symptoms) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(m.treatment) LIKE LOWER(CONCAT('%', :search, '%')))",
        countQuery = "SELECT COUNT(m) FROM MedicalRecord m " +
                     "WHERE (:patientId IS NULL OR m.patient.id = :patientId) " +
                     "AND (:doctorId IS NULL OR m.doctor.id = :doctorId) " +
                     "AND (:date IS NULL OR m.visitDate = :date) " +
                     "AND (:startDate IS NULL OR m.visitDate >= :startDate) " +
                     "AND (:endDate IS NULL OR m.visitDate <= :endDate) " +
                     "AND (:search IS NULL OR LOWER(m.patient.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(m.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(m.doctor.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(m.diagnosis) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(m.symptoms) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(m.treatment) LIKE LOWER(CONCAT('%', :search, '%')))"
    )
    Page<MedicalRecord> searchMedicalRecords(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search,
            Pageable pageable
    );
}
