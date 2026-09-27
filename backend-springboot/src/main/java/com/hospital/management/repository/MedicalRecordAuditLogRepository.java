package com.hospital.management.repository;

import com.hospital.management.entity.MedicalRecordAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordAuditLogRepository extends JpaRepository<MedicalRecordAuditLog, Long> {
    List<MedicalRecordAuditLog> findByMedicalRecordIdOrderByTimestampDesc(Long medicalRecordId);
}
