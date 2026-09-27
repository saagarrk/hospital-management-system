package com.hospital.management.repository;

import com.hospital.management.entity.Bill;
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
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);
    boolean existsByBillNumber(String billNumber);
    List<Bill> findByPatientId(Long patientId);
    Page<Bill> findByPatientId(Long patientId, Pageable pageable);
    List<Bill> findByAdmissionId(Long admissionId);
    Page<Bill> findByPaymentStatus(String paymentStatus, Pageable pageable);
    List<Bill> findByPaymentStatus(String paymentStatus);

    /**
     * Pessimistic write lock to prevent concurrent double-payments and financial corruption
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bill b WHERE b.id = :id")
    Optional<Bill> findByIdForUpdate(@Param("id") Long id);
}
