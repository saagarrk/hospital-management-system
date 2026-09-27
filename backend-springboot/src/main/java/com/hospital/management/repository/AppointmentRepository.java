package com.hospital.management.repository;

import com.hospital.management.entity.Appointment;
import com.hospital.management.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(Long patientId);

    Page<Appointment> findByPatientId(Long patientId, Pageable pageable);

    List<Appointment> findByDoctorId(Long doctorId);

    Page<Appointment> findByDoctorId(Long doctorId, Pageable pageable);

    Page<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date, Pageable pageable);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            Collection<AppointmentStatus> statuses
    );

    /**
     * Enforces SRS Business Rule 1: A doctor cannot have two appointments at the same time.
     * Checks if doctor has an active booking (PENDING, CONFIRMED) at that exact slot.
     */
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Collection<AppointmentStatus> statuses
    );

    /**
     * Enforces SRS Business Rule 6: Rescheduling must also validate conflicts.
     * Excludes the current appointment ID so updating same slot doesn't trigger self-collision.
     */
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndIdNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Collection<AppointmentStatus> statuses,
            Long excludeId
    );

    @Query(
        value = "SELECT a FROM Appointment a " +
                "JOIN FETCH a.patient p " +
                "JOIN FETCH a.doctor d " +
                "WHERE (:doctorId IS NULL OR d.id = :doctorId) " +
                "AND (:patientId IS NULL OR p.id = :patientId) " +
                "AND (:date IS NULL OR a.appointmentDate = :date) " +
                "AND (:startDate IS NULL OR a.appointmentDate >= :startDate) " +
                "AND (:endDate IS NULL OR a.appointmentDate <= :endDate) " +
                "AND (:status IS NULL OR a.status = :status) " +
                "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')))",
        countQuery = "SELECT COUNT(a) FROM Appointment a " +
                     "WHERE (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
                     "AND (:patientId IS NULL OR a.patient.id = :patientId) " +
                     "AND (:date IS NULL OR a.appointmentDate = :date) " +
                     "AND (:startDate IS NULL OR a.appointmentDate >= :startDate) " +
                     "AND (:endDate IS NULL OR a.appointmentDate <= :endDate) " +
                     "AND (:status IS NULL OR a.status = :status) " +
                     "AND (:search IS NULL OR LOWER(a.patient.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(a.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(a.doctor.name) LIKE LOWER(CONCAT('%', :search, '%')))"
    )
    Page<Appointment> searchAppointments(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") AppointmentStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
