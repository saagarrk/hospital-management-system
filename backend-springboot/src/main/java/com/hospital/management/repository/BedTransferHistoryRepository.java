package com.hospital.management.repository;

import com.hospital.management.entity.BedTransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedTransferHistoryRepository extends JpaRepository<BedTransferHistory, Long> {
    List<BedTransferHistory> findByAdmissionIdOrderByTransferDateDesc(Long admissionId);
    List<BedTransferHistory> findByPatientIdOrderByTransferDateDesc(Long patientId);
    List<BedTransferHistory> findAllByOrderByTransferDateDesc();
}
