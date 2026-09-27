package com.hospital.management.repository;

import com.hospital.management.entity.Bed;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByRoomId(Long roomId);
    List<Bed> findByStatus(String status);
    long countByStatus(String status);
    Optional<Bed> findByBedNumber(String bedNumber);
    boolean existsByBedNumber(String bedNumber);
    List<Bed> findByRoomIdAndStatus(Long roomId, String status);
    long countByRoomId(Long roomId);
    long countByRoomIdAndStatus(Long roomId, String status);

    /**
     * Pessimistic write lock for atomic admission, transfer, and status synchronization
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bed b WHERE b.id = :id")
    Optional<Bed> findByIdForUpdate(@Param("id") Long id);
}
