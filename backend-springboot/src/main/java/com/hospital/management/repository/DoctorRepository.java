package com.hospital.management.repository;

import com.hospital.management.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    List<Doctor> findByDepartmentId(Long departmentId);

    List<Doctor> findByStatus(String status);

    @Query("SELECT d FROM Doctor d WHERE " +
           "(:departmentId IS NULL OR d.department.id = :departmentId) AND " +
           "(:query IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.specialization) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Doctor> searchDoctors(@Param("departmentId") Long departmentId, @Param("query") String query, Pageable pageable);
}
