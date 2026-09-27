package com.hospital.management.repository;

import com.hospital.management.entity.LabReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabReportRepository extends JpaRepository<LabReport, Long> {

    List<LabReport> findByPatientId(Long patientId);

    List<LabReport> findByPatientIdOrderByReportedAtDesc(Long patientId);

    Page<LabReport> findByPatientIdOrderByReportedAtDesc(Long patientId, Pageable pageable);

    Optional<LabReport> findByLabTestId(Long labTestId);

    Optional<LabReport> findByReportNumber(String reportNumber);

    Page<LabReport> findAllByOrderByReportedAtDesc(Pageable pageable);
}
