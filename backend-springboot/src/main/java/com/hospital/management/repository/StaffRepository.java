package com.hospital.management.repository;

import com.hospital.management.entity.Role;
import com.hospital.management.entity.Staff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByRole(Role role);
    List<Staff> findByDepartmentId(Long departmentId);
    Page<Staff> findByStatus(String status, Pageable pageable);
}
