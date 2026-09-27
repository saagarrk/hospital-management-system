package com.hospital.management.repository;

import com.hospital.management.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBillId(Long billId);
    List<Payment> findByBillIdOrderByPaymentDateDesc(Long billId);
    Page<Payment> findAllByOrderByPaymentDateDesc(Pageable pageable);
    boolean existsByTransactionReference(String transactionReference);
    Optional<Payment> findByTransactionReference(String transactionReference);
}
