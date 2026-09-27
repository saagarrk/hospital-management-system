package com.hospital.management.repository;

import com.hospital.management.entity.Medicine;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    /**
     * Pessimistic Write Lock:
     * Serializes access to a specific medicine row (SELECT ... FOR UPDATE)
     * during dispensing and stock adjustments to prevent race conditions and negative inventory.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Medicine m WHERE m.id = :id")
    Optional<Medicine> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT m FROM Medicine m WHERE " +
           "LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.category) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.batchNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Medicine> searchMedicines(@Param("query") String query, Pageable pageable);

    Page<Medicine> findByNameContainingIgnoreCaseOrGenericNameContainingIgnoreCase(String name, String genericName, Pageable pageable);

    List<Medicine> findByExpiryDateBefore(LocalDate date);

    @Query("SELECT m FROM Medicine m WHERE m.stockQuantity <= m.minStockAlert")
    List<Medicine> findLowStockMedicines();

    Optional<Medicine> findByBatchNumber(String batchNumber);

    boolean existsByBatchNumber(String batchNumber);
}
