package com.hospital.management.repository;

import com.hospital.management.entity.LabTest;
import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {

    List<LabTest> findByPatientId(Long patientId);

    List<LabTest> findByPatientIdOrderByOrderedAtDesc(Long patientId);

    Page<LabTest> findByPatientIdOrderByOrderedAtDesc(Long patientId, Pageable pageable);

    List<LabTest> findByDoctorId(Long doctorId);

    List<LabTest> findByStatus(LabTestStatus status);

    List<LabTest> findByStatusOrderByOrderedAtDesc(LabTestStatus status);

    Page<LabTest> findByStatusOrderByOrderedAtDesc(LabTestStatus status, Pageable pageable);

    List<LabTest> findByStatusIn(List<LabTestStatus> statuses);

    @Query("SELECT t FROM LabTest t WHERE " +
           "(:patientId IS NULL OR t.patient.id = :patientId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:category IS NULL OR t.category = :category) AND " +
           "(:search IS NULL OR LOWER(t.testName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.patient.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LabTest> findFiltered(
            @Param("patientId") Long patientId,
            @Param("status") LabTestStatus status,
            @Param("category") LabTestCategory category,
            @Param("search") String search,
            Pageable pageable
    );
}
