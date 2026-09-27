package com.hospital.management.repository;

import com.hospital.management.entity.Patient;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByPatientCode(String patientCode);

    Optional<Patient> findByUserId(Long userId);

    boolean existsByPatientCode(String patientCode);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    long countByStatus(PatientStatus status);

    @Query("SELECT p FROM Patient p WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " p.phone LIKE CONCAT('%', :query, '%') OR " +
           " LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:name IS NULL OR :name = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:patientCode IS NULL OR :patientCode = '' OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :patientCode, '%'))) AND " +
           "(:mobile IS NULL OR :mobile = '' OR p.phone LIKE CONCAT('%', :mobile, '%')) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:gender IS NULL OR p.gender = :gender) AND " +
           "(:bloodGroup IS NULL OR :bloodGroup = '' OR p.bloodGroup = :bloodGroup)")
    Page<Patient> findWithAdvancedFilters(
            @Param("query") String query,
            @Param("name") String name,
            @Param("patientCode") String patientCode,
            @Param("mobile") String mobile,
            @Param("status") PatientStatus status,
            @Param("gender") Gender gender,
            @Param("bloodGroup") String bloodGroup,
            Pageable pageable
    );

    @Query("SELECT p FROM Patient p WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " p.phone LIKE CONCAT('%', :query, '%') OR " +
           " LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:gender IS NULL OR p.gender = :gender) AND " +
           "(:bloodGroup IS NULL OR :bloodGroup = '' OR p.bloodGroup = :bloodGroup)")
    Page<Patient> findWithFilters(
            @Param("query") String query,
            @Param("status") PatientStatus status,
            @Param("gender") Gender gender,
            @Param("bloodGroup") String bloodGroup,
            Pageable pageable
    );
}
