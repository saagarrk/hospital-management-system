package com.hospital.management.repository;

import com.hospital.management.entity.DischargeRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DischargeRepository extends JpaRepository<DischargeRecord, Long> {
    Optional<DischargeRecord> findByAdmissionId(Long admissionId);
    Page<DischargeRecord> findByPatientId(Long patientId, Pageable pageable);
}
