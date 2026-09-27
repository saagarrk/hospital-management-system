package com.hospital.management.service.impl;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.laboratory.*;
import com.hospital.management.entity.*;
import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestStatus;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.LabTestMapper;
import com.hospital.management.repository.*;
import com.hospital.management.service.LaboratoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LaboratoryServiceImpl implements LaboratoryService {

    private final LabTestRepository labTestRepository;
    private final LabReportRepository labReportRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final LabTestMapper labTestMapper;

    // =========================================================================
    // 1. CREATE TEST REQUEST (Doctor / Authorized Staff)
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LabTestResponse createTestRequest(LabTestOrderRequest request, String requestedByUsername) {
        log.info("Creating lab test request for patientId={} by {}", request.getPatientId(), requestedByUsername);

        // Business Rule: Only authorized medical staff can author test requests
        verifyRequisitionAuthority(requestedByUsername);

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        Doctor doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorRepository.findById(request.getDoctorId()).orElse(null);
        } else if (requestedByUsername != null) {
            doctor = doctorRepository.findAll().stream()
                    .filter(d -> d.getUser() != null && d.getUser().getUsername().equalsIgnoreCase(requestedByUsername))
                    .findFirst()
                    .orElse(null);
        }

        LabTest labTest = labTestMapper.toEntity(request, patient, doctor);
        labTest.setStatus(LabTestStatus.ORDERED);
        labTest.setOrderedAt(LocalDateTime.now());

        LabTest saved = labTestRepository.save(labTest);
        log.info("Lab test order #{} ('{}') created for patient {}", saved.getId(), saved.getTestName(), patient.getName());
        return labTestMapper.toResponse(saved);
    }

    // =========================================================================
    // 2. ASSIGN LABORATORY TECHNICIAN
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LabTestResponse assignTechnician(Long testId, LabTechnicianAssignRequest request, String assignedByUsername) {
        LabTest test = findTestOrThrow(testId);
        validateTransition(test, LabTestStatus.ASSIGNED);

        test.setAssignedTechnician(request.getTechnicianName().trim());
        test.setAssignedAt(LocalDateTime.now());
        test.setStatus(LabTestStatus.ASSIGNED);

        LabTest saved = labTestRepository.save(test);
        log.info("Lab test #{} assigned to technician '{}' by {}", testId, request.getTechnicianName(), assignedByUsername);
        return labTestMapper.toResponse(saved);
    }

    // =========================================================================
    // 3. SAMPLE COLLECTION
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LabTestResponse collectSample(Long testId, SampleCollectionRequest request, String collectedByUsername) {
        LabTest test = findTestOrThrow(testId);
        validateTransition(test, LabTestStatus.SAMPLE_COLLECTED);

        String barcode = request.getSampleBarcode();
        if (barcode == null || barcode.trim().isEmpty()) {
            barcode = String.format("SMP-%d-%05d", LocalDateTime.now().getYear(), test.getId());
        }

        test.setSampleType(request.getSampleType().trim());
        test.setSampleBarcode(barcode.trim());
        test.setSampleCollectedAt(LocalDateTime.now());
        test.setSampleCollectedBy(collectedByUsername != null ? collectedByUsername : "Phlebotomist / Staff");
        test.setStatus(LabTestStatus.SAMPLE_COLLECTED);

        LabTest saved = labTestRepository.save(test);
        log.info("Sample collected for Lab test #{}: Barcode={}, Type={}", testId, barcode, request.getSampleType());
        return labTestMapper.toResponse(saved);
    }

    // =========================================================================
    // 4. TEST PROCESSING
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LabTestResponse startProcessing(Long testId, String technicianUsername) {
        LabTest test = findTestOrThrow(testId);
        validateTransition(test, LabTestStatus.PROCESSING);

        test.setProcessingStartedAt(LocalDateTime.now());
        test.setStatus(LabTestStatus.PROCESSING);
        if (test.getAssignedTechnician() == null) {
            test.setAssignedTechnician(technicianUsername);
        }

        LabTest saved = labTestRepository.save(test);
        log.info("Lab test #{} placed into analyzer processing by {}", testId, technicianUsername);
        return labTestMapper.toResponse(saved);
    }

    // =========================================================================
    // 5. RESULT ENTRY (SRS Rule 6: Lab Technician only)
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LabTestResponse recordTestResult(Long testId, LabTestResultRequest request, String technicianUsername) {
        // Enforces SRS Rule 6: Only laboratory technicians can enter/update results
        verifyLabTechnicianAuthority(technicianUsername);

        LabTest test = findTestOrThrow(testId);
        validateTransition(test, LabTestStatus.RESULT_ENTERED);

        test.setResultValue(request.getResultValue().trim());
        test.setNormalRange(request.getNormalRange() != null ? request.getNormalRange().trim() : "Standard Reference");
        test.setUnits(request.getUnits() != null ? request.getUnits().trim() : "");
        test.setInterpretation(request.getInterpretation() != null ? request.getInterpretation().trim() : "NORMAL");
        test.setRemarks(request.getRemarks() != null ? request.getRemarks().trim() : null);
        test.setTechnicianName(technicianUsername);
        test.setResultEnteredAt(LocalDateTime.now());
        test.setStatus(LabTestStatus.RESULT_ENTERED);

        LabTest saved = labTestRepository.save(test);
        log.info("Results recorded for Lab test #{} by technician {}", testId, technicianUsername);
        return labTestMapper.toResponse(saved);
    }

    // =========================================================================
    // 6. GENERATE LAB REPORT & SIGN-OFF
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LabReportResponse generateLabReport(Long testId, String verifiedByDoctor, String technicianUsername) {
        LabTest test = findTestOrThrow(testId);
        validateTransition(test, LabTestStatus.COMPLETED);

        if (test.getResultValue() == null || test.getResultValue().trim().isEmpty()) {
            throw new BusinessRuleException(
                    "Cannot generate diagnostic report without recorded test results. Please record results first.",
                    HttpStatus.BAD_REQUEST
            );
        }

        String reportNum = String.format("REP-%d-%05d", LocalDateTime.now().getYear(), test.getId());

        test.setStatus(LabTestStatus.COMPLETED);
        test.setCompletedAt(LocalDateTime.now());
        test.setReportNumber(reportNum);
        test.setVerifiedByDoctor(verifiedByDoctor != null ? verifiedByDoctor : "Chief Clinical Pathologist");

        LabTest savedTest = labTestRepository.save(test);

        User techUser = userRepository.findByUsername(technicianUsername).orElse(null);
        if (techUser == null) {
            techUser = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.LAB_TECHNICIAN)
                    .findFirst()
                    .orElse(null);
        }

        Doctor docEntity = test.getDoctor();

        LabReport report = LabReport.builder()
                .reportNumber(reportNum)
                .labTest(savedTest)
                .patient(savedTest.getPatient())
                .technician(techUser)
                .verifiedByDoctor(docEntity)
                .resultSummary(savedTest.getResultValue())
                .normalRange(savedTest.getNormalRange())
                .units(savedTest.getUnits())
                .interpretation(savedTest.getInterpretation() != null ? savedTest.getInterpretation() : "NORMAL")
                .remarks(savedTest.getRemarks())
                .status("FINAL")
                .reportedAt(LocalDateTime.now())
                .build();

        LabReport savedReport = labReportRepository.save(report);
        log.info("Lab Report #{} generated for test #{}, patient {}", reportNum, testId, test.getPatient().getName());
        return labTestMapper.toReportResponse(savedReport);
    }

    // =========================================================================
    // 7. CANCELLATION
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LabTestResponse cancelTest(Long testId, LabTestCancelRequest request, String username) {
        LabTest test = findTestOrThrow(testId);

        if (test.getStatus() == LabTestStatus.COMPLETED) {
            throw new BusinessRuleException(
                    "Cannot cancel a laboratory test that is already COMPLETED with a finalized clinical report.",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (test.getStatus() == LabTestStatus.CANCELLED) {
            throw new BusinessRuleException("Lab test is already cancelled.", HttpStatus.BAD_REQUEST);
        }

        test.setStatus(LabTestStatus.CANCELLED);
        test.setCancellationReason(request.getReason().trim());
        test.setCancelledAt(LocalDateTime.now());
        test.setCancelledBy(username != null ? username : "Staff");

        LabTest saved = labTestRepository.save(test);
        log.info("Lab test #{} cancelled by {}: {}", testId, username, request.getReason());
        return labTestMapper.toResponse(saved);
    }

    // =========================================================================
    // 8. QUERIES WITH SECURITY & PATIENT ISOLATION (SRS Rule 9)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public LabTestResponse getTestById(Long testId, String currentUsername) {
        LabTest test = findTestOrThrow(testId);
        verifyAccess(test.getPatient(), currentUsername);
        return labTestMapper.toResponse(test);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabTestResponse> getTestsByPatient(Long patientId, String currentUsername) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        verifyAccess(patient, currentUsername);

        return labTestRepository.findByPatientIdOrderByOrderedAtDesc(patientId).stream()
                .map(labTestMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<LabTestResponse> getTestsByPatientPaged(Long patientId, Pageable pageable, String currentUsername) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        verifyAccess(patient, currentUsername);

        Page<LabTest> page = labTestRepository.findByPatientIdOrderByOrderedAtDesc(patientId, pageable);
        List<LabTestResponse> content = page.getContent().stream()
                .map(labTestMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<LabTestResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabReportResponse> getReportsByPatient(Long patientId, String currentUsername) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        verifyAccess(patient, currentUsername);

        return labReportRepository.findByPatientIdOrderByReportedAtDesc(patientId).stream()
                .map(labTestMapper::toReportResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LabReportResponse getReportByTestId(Long testId, String currentUsername) {
        LabReport report = labReportRepository.findByLabTestId(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnostic report not found for test id: " + testId));

        verifyAccess(report.getPatient(), currentUsername);
        return labTestMapper.toReportResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public LabReportResponse getReportById(Long reportId, String currentUsername) {
        LabReport report = labReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnostic report not found with id: " + reportId));

        verifyAccess(report.getPatient(), currentUsername);
        return labTestMapper.toReportResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<LabTestResponse> getFilteredTests(Long patientId, LabTestStatus status, LabTestCategory category, String search, Pageable pageable) {
        Page<LabTest> page = labTestRepository.findFiltered(patientId, status, category, search, pageable);
        List<LabTestResponse> content = page.getContent().stream()
                .map(labTestMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<LabTestResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabTestResponse> getPendingWorklist(LabTestStatus status) {
        LabTestStatus target = status != null ? status : LabTestStatus.ORDERED;
        return labTestRepository.findByStatusOrderByOrderedAtDesc(target).stream()
                .map(labTestMapper::toResponse)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // VALIDATIONS & PERMISSION HELPERS
    // =========================================================================

    private LabTest findTestOrThrow(Long testId) {
        return labTestRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory test not found with id: " + testId));
    }

    private void validateTransition(LabTest test, LabTestStatus target) {
        if (!test.getStatus().canTransitionTo(target)) {
            throw new BusinessRuleException(
                    String.format("Invalid laboratory workflow transition from '%s' to '%s'. Mandatory progression: ORDERED → ASSIGNED → SAMPLE_COLLECTED → PROCESSING → RESULT_ENTERED → COMPLETED.",
                            test.getStatus(), target),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private void verifyRequisitionAuthority(String username) {
        if (username == null || username.trim().isEmpty()) return;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            Role role = user.getRole();
            if (role == Role.PATIENT || role == Role.RECEPTIONIST) {
                throw new UnauthorizedActionException(
                        String.format("Requisition Prohibited: Role '%s' does not have clinical authority to order laboratory tests. Only licensed doctors, triage nurses, and medical administrators can author requisitions.", role)
                );
            }
        }
    }

    private void verifyLabTechnicianAuthority(String username) {
        if (username == null || username.trim().isEmpty()) return;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            Role role = user.getRole();
            if (role != Role.LAB_TECHNICIAN && role != Role.ADMIN) {
                throw new UnauthorizedActionException(
                        String.format("SRS Rule 6 Violation: User role '%s' cannot record or modify diagnostic test results. Only certified laboratory technicians can enter clinical findings.", role)
                );
            }
        }
    }

    private void verifyAccess(Patient patient, String currentUsername) {
        if (currentUsername == null || currentUsername.trim().isEmpty()) return;

        User user = userRepository.findByUsername(currentUsername).orElse(null);
        if (user != null && user.getRole() == Role.PATIENT) {
            Patient userPatient = patientRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && p.getUser().getUsername().equalsIgnoreCase(currentUsername))
                    .findFirst()
                    .orElse(null);

            if (userPatient != null && !patient.getId().equals(userPatient.getId())) {
                throw new UnauthorizedActionException("SRS Rule 9 Privacy Violation: Patients are strictly restricted to querying their own laboratory tests and diagnostic reports.");
            }
        }
    }
}
