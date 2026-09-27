package com.hospital.management.repository;

import com.hospital.management.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByMedicineIdOrderByCreatedAtDesc(Long medicineId);

    Page<InventoryTransaction> findByMedicineIdOrderByCreatedAtDesc(Long medicineId, Pageable pageable);

    Page<InventoryTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<InventoryTransaction> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);
}
