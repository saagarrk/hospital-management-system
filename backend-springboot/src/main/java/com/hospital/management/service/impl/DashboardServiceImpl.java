package com.hospital.management.service.impl;

import com.hospital.management.dto.dashboard.*;
import com.hospital.management.entity.*;
import com.hospital.management.enums.AppointmentStatus;
import com.hospital.management.enums.BedStatus;
import com.hospital.management.enums.LabTestStatus;
import com.hospital.management.repository.*;
import com.hospital.management.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final BedRepository bedRepository;
    private final MedicineRepository medicineRepository;
    private final LabTestRepository labTestRepository;
    private final LabReportRepository labReportRepository;
    private final PrescriptionRepository prescriptionRepository;

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        long totalPatients = patientRepository.count();
        long totalDoctors = doctorRepository.count();

        LocalDate today = LocalDate.now();
        List<Appointment> allAppointments = appointmentRepository.findAll();
        List<Appointment> todaysAppointments = allAppointments.stream()
                .filter(a -> a.getAppointmentDate() != null && a.getAppointmentDate().equals(today))
                .sorted(Comparator.comparing(Appointment::getAppointmentTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<Bill> allBills = billRepository.findAll();
        BigDecimal totalBilled = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;
        long pendingPaymentsCount = 0;
        BigDecimal pendingPaymentsAmount = BigDecimal.ZERO;

        for (Bill b : allBills) {
            BigDecimal net = b.getNetAmount() != null ? b.getNetAmount() : BigDecimal.ZERO;
            BigDecimal paid = b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO;
            totalBilled = totalBilled.add(net);
            totalCollected = totalCollected.add(paid);

            if (!"PAID".equalsIgnoreCase(b.getPaymentStatus())) {
                pendingPaymentsCount++;
                BigDecimal remaining = net.subtract(paid);
                if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                    pendingPaymentsAmount = pendingPaymentsAmount.add(remaining);
                }
            }
        }
        BigDecimal totalPendingRevenue = totalBilled.subtract(totalCollected).max(BigDecimal.ZERO);

        List<Bed> allBeds = bedRepository.findAll();
        long totalBeds = allBeds.size();
        long availableBeds = allBeds.stream().filter(b -> b.getStatus() == BedStatus.AVAILABLE).count();
        long occupiedBeds = allBeds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
        long reservedBeds = allBeds.stream().filter(b -> b.getStatus() == BedStatus.RESERVED).count();
        long maintenanceBeds = allBeds.stream().filter(b -> b.getStatus() == BedStatus.MAINTENANCE).count();
        int occupancyRate = totalBeds > 0 ? (int) Math.round(((double) occupiedBeds / totalBeds) * 100) : 0;

        List<Medicine> allMedicines = medicineRepository.findAll();
        List<Medicine> lowStockList = allMedicines.stream()
                .filter(m -> m.getStockQuantity() <= m.getMinStockAlert())
                .collect(Collectors.toList());
        long expiredMedicines = allMedicines.stream()
                .filter(m -> m.getExpiryDate() != null && m.getExpiryDate().isBefore(today))
                .count();

        List<LabTest> allTests = labTestRepository.findAll();
        long pendingTestsCount = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.ORDERED || t.getStatus() == LabTestStatus.SAMPLE_COLLECTED)
                .count();
        long processingTestsCount = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.PROCESSING || t.getStatus() == LabTestStatus.RESULT_ENTERED)
                .count();
        long completedTestsCount = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.COMPLETED)
                .count();

        // Convert today's appointments to summary maps
        List<Map<String, Object>> appointmentSummaries = todaysAppointments.stream().limit(8).map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("patientName", a.getPatient() != null ? a.getPatient().getName() : "Unknown");
            map.put("patientCode", a.getPatient() != null ? a.getPatient().getPatientCode() : "");
            map.put("doctorName", a.getDoctor() != null ? a.getDoctor().getName() : "Unassigned");
            map.put("department", a.getDoctor() != null && a.getDoctor().getDepartment() != null ? a.getDoctor().getDepartment().getName() : "");
            map.put("time", a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "");
            map.put("status", a.getStatus() != null ? a.getStatus().name() : "");
            return map;
        }).collect(Collectors.toList());

        // Low stock list
        List<Map<String, Object>> lowStockSummaries = lowStockList.stream().limit(6).map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getName());
            map.put("stockQuantity", m.getStockQuantity());
            map.put("minStockAlert", m.getMinStockAlert());
            map.put("category", m.getCategory());
            map.put("unitPrice", m.getUnitPrice());
            return map;
        }).collect(Collectors.toList());

        // Pending lab tests
        List<Map<String, Object>> pendingLabSummaries = allTests.stream()
                .filter(t -> t.getStatus() != LabTestStatus.COMPLETED && t.getStatus() != LabTestStatus.CANCELLED)
                .limit(6)
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("testName", t.getTestName());
                    map.put("patientName", t.getPatient() != null ? t.getPatient().getName() : "");
                    map.put("priority", t.getPriority() != null ? t.getPriority().name() : "ROUTINE");
                    map.put("status", t.getStatus() != null ? t.getStatus().name() : "");
                    return map;
                }).collect(Collectors.toList());

        return AdminDashboardResponse.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .todaysAppointmentsCount(todaysAppointments.size())
                .pendingPaymentsCount(pendingPaymentsCount)
                .pendingPaymentsAmount(pendingPaymentsAmount)
                .totalBilledRevenue(totalBilled)
                .totalCollectedRevenue(totalCollected)
                .totalPendingRevenue(totalPendingRevenue)
                .totalBeds(totalBeds)
                .availableBeds(availableBeds)
                .occupiedBeds(occupiedBeds)
                .reservedBeds(reservedBeds)
                .maintenanceBeds(maintenanceBeds)
                .bedOccupancyPercentage(occupancyRate)
                .lowStockMedicinesCount(lowStockList.size())
                .expiredMedicinesCount(expiredMedicines)
                .pendingLabTestsCount(pendingTestsCount)
                .processingLabTestsCount(processingTestsCount)
                .completedLabTestsCount(completedTestsCount)
                .todaysAppointments(appointmentSummaries)
                .lowStockMedicines(lowStockSummaries)
                .pendingLabTests(pendingLabSummaries)
                .build();
    }

    @Override
    public DoctorDashboardResponse getDoctorDashboard(Long doctorId) {
        Doctor doc = doctorId != null ? doctorRepository.findById(doctorId).orElse(null) : null;
        if (doc == null) {
            List<Doctor> docs = doctorRepository.findAll();
            if (!docs.isEmpty()) {
                doc = docs.get(0);
            }
        }

        Long targetDocId = doc != null ? doc.getId() : null;
        String docName = doc != null ? doc.getName() : "Attending Physician";
        String spec = doc != null ? doc.getSpecialization() : "General Medicine";

        LocalDate today = LocalDate.now();
        List<Appointment> docAppointments = targetDocId != null ? appointmentRepository.findByDoctorId(targetDocId) : Collections.emptyList();

        List<Appointment> todayAppts = docAppointments.stream()
                .filter(a -> a.getAppointmentDate() != null && a.getAppointmentDate().equals(today))
                .sorted(Comparator.comparing(Appointment::getAppointmentTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<Appointment> upcomingAppts = docAppointments.stream()
                .filter(a -> a.getAppointmentDate() != null && a.getAppointmentDate().isAfter(today) && a.getStatus() != AppointmentStatus.CANCELLED)
                .sorted(Comparator.comparing(Appointment::getAppointmentDate).thenComparing(Appointment::getAppointmentTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        long patientCount = docAppointments.stream()
                .map(Appointment::getPatient)
                .filter(Objects::nonNull)
                .map(Patient::getId)
                .distinct()
                .count();

        List<LabTest> docLabTests = targetDocId != null ? labTestRepository.findByDoctorId(targetDocId) : Collections.emptyList();
        List<LabTest> pendingReports = docLabTests.stream()
                .filter(t -> t.getStatus() != LabTestStatus.COMPLETED && t.getStatus() != LabTestStatus.CANCELLED)
                .collect(Collectors.toList());

        List<Prescription> docRx = targetDocId != null ? prescriptionRepository.findByDoctorId(targetDocId) : Collections.emptyList();

        List<Map<String, Object>> todayList = todayAppts.stream().limit(10).map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("patientName", a.getPatient() != null ? a.getPatient().getName() : "");
            map.put("patientCode", a.getPatient() != null ? a.getPatient().getPatientCode() : "");
            map.put("time", a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "");
            map.put("reason", a.getReason() != null ? a.getReason() : "Consultation");
            map.put("status", a.getStatus() != null ? a.getStatus().name() : "");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> upcomingList = upcomingAppts.stream().limit(8).map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("patientName", a.getPatient() != null ? a.getPatient().getName() : "");
            map.put("date", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : "");
            map.put("time", a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "");
            map.put("status", a.getStatus() != null ? a.getStatus().name() : "");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> labList = pendingReports.stream().limit(6).map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("testName", t.getTestName());
            map.put("patientName", t.getPatient() != null ? t.getPatient().getName() : "");
            map.put("priority", t.getPriority() != null ? t.getPriority().name() : "ROUTINE");
            map.put("status", t.getStatus() != null ? t.getStatus().name() : "");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> rxList = docRx.stream().limit(6).map(rx -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rx.getId());
            map.put("patientName", rx.getPatient() != null ? rx.getPatient().getName() : "");
            map.put("prescriptionNumber", rx.getPrescriptionNumber());
            map.put("diagnosis", rx.getDiagnosis());
            map.put("createdAt", rx.getCreatedAt() != null ? rx.getCreatedAt().toString() : "");
            return map;
        }).collect(Collectors.toList());

        return DoctorDashboardResponse.builder()
                .doctorId(targetDocId)
                .doctorName(docName)
                .specialization(spec)
                .todaysAppointmentsCount(todayAppts.size())
                .upcomingAppointmentsCount(upcomingAppts.size())
                .totalPatientsTreated(patientCount)
                .pendingLabReportsCount(pendingReports.size())
                .recentPrescriptionsCount(docRx.size())
                .todaysAppointments(todayList)
                .upcomingAppointments(upcomingList)
                .pendingLabReports(labList)
                .recentPrescriptions(rxList)
                .build();
    }

    @Override
    public ReceptionistDashboardResponse getReceptionistDashboard() {
        LocalDate today = LocalDate.now();
        List<Appointment> allAppointments = appointmentRepository.findAll();
        List<Appointment> todayAppts = allAppointments.stream()
                .filter(a -> a.getAppointmentDate() != null && a.getAppointmentDate().equals(today))
                .sorted(Comparator.comparing(Appointment::getAppointmentTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<Patient> allPatients = patientRepository.findAll();
        long newRegistrations = allPatients.size();

        List<Doctor> allDoctors = doctorRepository.findAll();
        long availableDoctors = allDoctors.stream()
                .filter(d -> d.getUser() == null || d.getUser().isActive())
                .count();

        List<Bed> allBeds = bedRepository.findAll();
        long availableBedsCount = allBeds.stream().filter(b -> b.getStatus() == BedStatus.AVAILABLE).count();

        List<Bill> allBills = billRepository.findAll();
        long pendingPaymentsCount = 0;
        BigDecimal pendingPaymentsAmount = BigDecimal.ZERO;
        List<Map<String, Object>> pendingCounterBills = new ArrayList<>();

        for (Bill b : allBills) {
            if (!"PAID".equalsIgnoreCase(b.getPaymentStatus())) {
                pendingPaymentsCount++;
                BigDecimal net = b.getNetAmount() != null ? b.getNetAmount() : BigDecimal.ZERO;
                BigDecimal paid = b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO;
                BigDecimal bal = net.subtract(paid).max(BigDecimal.ZERO);
                pendingPaymentsAmount = pendingPaymentsAmount.add(bal);

                if (pendingCounterBills.size() < 6) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("billNumber", b.getBillNumber());
                    map.put("patientName", b.getPatient() != null ? b.getPatient().getName() : "");
                    map.put("netAmount", net);
                    map.put("balance", bal);
                    map.put("paymentStatus", b.getPaymentStatus());
                    pendingCounterBills.add(map);
                }
            }
        }

        List<Map<String, Object>> todayList = todayAppts.stream().limit(8).map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("patientName", a.getPatient() != null ? a.getPatient().getName() : "");
            map.put("patientCode", a.getPatient() != null ? a.getPatient().getPatientCode() : "");
            map.put("doctorName", a.getDoctor() != null ? a.getDoctor().getName() : "");
            map.put("time", a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "");
            map.put("status", a.getStatus() != null ? a.getStatus().name() : "");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> doctorsList = allDoctors.stream().limit(6).map(d -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("name", d.getName());
            map.put("specialization", d.getSpecialization());
            map.put("roomNumber", d.getRoomNumber());
            map.put("status", "AVAILABLE");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> bedsList = allBeds.stream()
                .filter(b -> b.getStatus() == BedStatus.AVAILABLE)
                .limit(6)
                .map(b -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", b.getId());
                    map.put("bedNumber", b.getBedNumber());
                    map.put("roomNumber", b.getRoom() != null ? b.getRoom().getRoomNumber() : "");
                    map.put("dailyRate", b.getDailyRate());
                    map.put("status", "AVAILABLE");
                    return map;
                }).collect(Collectors.toList());

        return ReceptionistDashboardResponse.builder()
                .todaysAppointmentsCount(todayAppts.size())
                .newRegistrationsCount(newRegistrations)
                .availableDoctorsCount(availableDoctors)
                .availableBedsCount(availableBedsCount)
                .pendingPaymentsCount(pendingPaymentsCount)
                .pendingPaymentsAmount(pendingPaymentsAmount)
                .todaysAppointments(todayList)
                .availableDoctors(doctorsList)
                .availableBeds(bedsList)
                .pendingCounterBills(pendingCounterBills)
                .build();
    }

    @Override
    public PharmacistDashboardResponse getPharmacistDashboard() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysLater = today.plusDays(30);

        List<Medicine> allMeds = medicineRepository.findAll();
        List<Medicine> lowStock = allMeds.stream()
                .filter(m -> m.getStockQuantity() <= m.getMinStockAlert())
                .collect(Collectors.toList());
        List<Medicine> expiring = allMeds.stream()
                .filter(m -> m.getExpiryDate() != null && m.getExpiryDate().isBefore(thirtyDaysLater))
                .collect(Collectors.toList());
        long outOfStock = allMeds.stream().filter(m -> m.getStockQuantity() <= 0).count();

        BigDecimal valuation = BigDecimal.ZERO;
        for (Medicine m : allMeds) {
            if (m.getUnitPrice() != null && m.getStockQuantity() > 0) {
                valuation = valuation.add(m.getUnitPrice().multiply(BigDecimal.valueOf(m.getStockQuantity())));
            }
        }

        List<Prescription> allRx = prescriptionRepository.findAll();
        long todaysRxCount = allRx.size();
        long pendingDispense = allRx.stream().filter(r -> "PENDING".equalsIgnoreCase(r.getStatus())).count();
        long dispensed = allRx.stream().filter(r -> "DISPENSED".equalsIgnoreCase(r.getStatus())).count();

        List<Map<String, Object>> lowStockList = lowStock.stream().limit(8).map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getName());
            map.put("stockQuantity", m.getStockQuantity());
            map.put("minStockAlert", m.getMinStockAlert());
            map.put("category", m.getCategory());
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> expiringList = expiring.stream().limit(8).map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getName());
            map.put("expiryDate", m.getExpiryDate() != null ? m.getExpiryDate().toString() : "");
            map.put("batchNumber", m.getBatchNumber());
            map.put("stockQuantity", m.getStockQuantity());
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> rxList = allRx.stream().limit(8).map(rx -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rx.getId());
            map.put("prescriptionNumber", rx.getPrescriptionNumber());
            map.put("patientName", rx.getPatient() != null ? rx.getPatient().getName() : "");
            map.put("doctorName", rx.getDoctor() != null ? rx.getDoctor().getName() : "");
            map.put("status", rx.getStatus());
            return map;
        }).collect(Collectors.toList());

        return PharmacistDashboardResponse.builder()
                .lowStockMedicinesCount(lowStock.size())
                .expiringMedicinesCount(expiring.size())
                .outOfStockCount(outOfStock)
                .totalMedicinesCount(allMeds.size())
                .totalInventoryValuation(valuation)
                .todaysPrescriptionsCount(todaysRxCount)
                .pendingDispenseCount(pendingDispense)
                .dispensedCount(dispensed)
                .lowStockMedicines(lowStockList)
                .expiringMedicines(expiringList)
                .todaysPrescriptions(rxList)
                .build();
    }

    @Override
    public LabTechnicianDashboardResponse getLabTechnicianDashboard() {
        List<LabTest> allTests = labTestRepository.findAll();

        long pending = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.ORDERED || t.getStatus() == LabTestStatus.SAMPLE_COLLECTED)
                .count();
        long inProgress = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.PROCESSING || t.getStatus() == LabTestStatus.RESULT_ENTERED)
                .count();
        long completed = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.COMPLETED)
                .count();
        long statUrgent = allTests.stream()
                .filter(t -> (t.getPriority() != null && (t.getPriority().name().equals("STAT") || t.getPriority().name().equals("URGENT")))
                        && t.getStatus() != LabTestStatus.COMPLETED && t.getStatus() != LabTestStatus.CANCELLED)
                .count();

        List<Map<String, Object>> pendingList = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.ORDERED || t.getStatus() == LabTestStatus.SAMPLE_COLLECTED)
                .limit(8)
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("testName", t.getTestName());
                    map.put("patientName", t.getPatient() != null ? t.getPatient().getName() : "");
                    map.put("priority", t.getPriority() != null ? t.getPriority().name() : "ROUTINE");
                    map.put("status", t.getStatus().name());
                    return map;
                }).collect(Collectors.toList());

        List<Map<String, Object>> inProgressList = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.PROCESSING || t.getStatus() == LabTestStatus.RESULT_ENTERED)
                .limit(8)
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("testName", t.getTestName());
                    map.put("patientName", t.getPatient() != null ? t.getPatient().getName() : "");
                    map.put("priority", t.getPriority() != null ? t.getPriority().name() : "ROUTINE");
                    map.put("status", t.getStatus().name());
                    return map;
                }).collect(Collectors.toList());

        List<Map<String, Object>> completedList = allTests.stream()
                .filter(t -> t.getStatus() == LabTestStatus.COMPLETED)
                .limit(8)
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("testName", t.getTestName());
                    map.put("patientName", t.getPatient() != null ? t.getPatient().getName() : "");
                    map.put("status", "COMPLETED");
                    return map;
                }).collect(Collectors.toList());

        return LabTechnicianDashboardResponse.builder()
                .pendingTestsCount(pending)
                .testsInProgressCount(inProgress)
                .completedTestsCount(completed)
                .statUrgentTestsCount(statUrgent)
                .totalTestsCount(allTests.size())
                .pendingTests(pendingList)
                .inProgressTests(inProgressList)
                .completedTests(completedList)
                .build();
    }

    @Override
    public PatientDashboardResponse getPatientDashboard(Long patientId) {
        Patient patient = patientId != null ? patientRepository.findById(patientId).orElse(null) : null;
        if (patient == null) {
            List<Patient> patients = patientRepository.findAll();
            if (!patients.isEmpty()) {
                patient = patients.get(0);
            }
        }

        Long targetPatId = patient != null ? patient.getId() : null;
        String name = patient != null ? patient.getName() : "Patient";
        String code = patient != null ? patient.getPatientCode() : "";

        LocalDate today = LocalDate.now();
        List<Appointment> patAppts = targetPatId != null ? appointmentRepository.findByPatientId(targetPatId) : Collections.emptyList();
        List<Appointment> upcoming = patAppts.stream()
                .filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(today) && a.getStatus() != AppointmentStatus.CANCELLED)
                .sorted(Comparator.comparing(Appointment::getAppointmentDate).thenComparing(Appointment::getAppointmentTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<Prescription> patRx = targetPatId != null ? prescriptionRepository.findByPatientId(targetPatId) : Collections.emptyList();
        List<LabTest> patTests = targetPatId != null ? labTestRepository.findByPatientId(targetPatId) : Collections.emptyList();
        List<Bill> patBills = targetPatId != null ? billRepository.findByPatientId(targetPatId) : Collections.emptyList();

        long outstandingBillsCount = 0;
        BigDecimal totalOutstanding = BigDecimal.ZERO;

        for (Bill b : patBills) {
            if (!"PAID".equalsIgnoreCase(b.getPaymentStatus())) {
                outstandingBillsCount++;
                BigDecimal net = b.getNetAmount() != null ? b.getNetAmount() : BigDecimal.ZERO;
                BigDecimal paid = b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO;
                totalOutstanding = totalOutstanding.add(net.subtract(paid).max(BigDecimal.ZERO));
            }
        }

        List<Map<String, Object>> upcomingList = upcoming.stream().limit(6).map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("doctorName", a.getDoctor() != null ? a.getDoctor().getName() : "");
            map.put("specialization", a.getDoctor() != null ? a.getDoctor().getSpecialization() : "");
            map.put("date", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : "");
            map.put("time", a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "");
            map.put("status", a.getStatus() != null ? a.getStatus().name() : "");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> rxList = patRx.stream().limit(6).map(rx -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rx.getId());
            map.put("prescriptionNumber", rx.getPrescriptionNumber());
            map.put("doctorName", rx.getDoctor() != null ? rx.getDoctor().getName() : "");
            map.put("diagnosis", rx.getDiagnosis());
            map.put("date", rx.getCreatedAt() != null ? rx.getCreatedAt().toString() : "");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> testList = patTests.stream().limit(6).map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("testName", t.getTestName());
            map.put("category", t.getCategory() != null ? t.getCategory().name() : "");
            map.put("status", t.getStatus() != null ? t.getStatus().name() : "");
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> billList = patBills.stream().limit(6).map(b -> {
            BigDecimal net = b.getNetAmount() != null ? b.getNetAmount() : BigDecimal.ZERO;
            BigDecimal paid = b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO;
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("billNumber", b.getBillNumber());
            map.put("netAmount", net);
            map.put("paidAmount", paid);
            map.put("balance", net.subtract(paid).max(BigDecimal.ZERO));
            map.put("paymentStatus", b.getPaymentStatus());
            return map;
        }).collect(Collectors.toList());

        return PatientDashboardResponse.builder()
                .patientId(targetPatId)
                .patientName(name)
                .patientCode(code)
                .upcomingAppointmentsCount(upcoming.size())
                .recentPrescriptionsCount(patRx.size())
                .completedLabReportsCount(patTests.stream().filter(t -> t.getStatus() == LabTestStatus.COMPLETED).count())
                .outstandingBillsCount(outstandingBillsCount)
                .outstandingBalanceAmount(totalOutstanding)
                .upcomingAppointments(upcomingList)
                .recentPrescriptions(rxList)
                .labReports(testList)
                .outstandingBills(billList)
                .build();
    }
}
