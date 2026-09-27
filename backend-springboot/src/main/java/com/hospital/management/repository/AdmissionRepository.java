package com.hospital.management.repository;

import com.hospital.management.entity.Admission;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    List<Admission> findByPatientId(Long patientId);

    /**
     * Enforces SRS Rule 8: Active admission check
     */
    Optional<Admission> findByPatientIdAndStatus(Long patientId, String status);

    boolean existsByPatientIdAndStatus(Long patientId, String status);

    List<Admission> findByStatus(String status);

    Page<Admission> findByStatus(String status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Admission a WHERE a.id = :id")
    Optional<Admission> findByIdForUpdate(@Param("id") Long id);
}
