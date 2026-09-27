package com.hospital.management.service;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.laboratory.*;
import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LaboratoryService {

    // 1. Request Requisition (Doctor / Authorized Staff)
    LabTestResponse createTestRequest(LabTestOrderRequest request, String requestedByUsername);

    // 2. Assign Technician
    LabTestResponse assignTechnician(Long testId, LabTechnicianAssignRequest request, String assignedByUsername);

    // 3. Specimen / Sample Collection
    LabTestResponse collectSample(Long testId, SampleCollectionRequest request, String collectedByUsername);

    // 4. Test Processing
    LabTestResponse startProcessing(Long testId, String technicianUsername);

    // 5. Result Entry (SRS Rule 6: Lab Technician only)
    LabTestResponse recordTestResult(Long testId, LabTestResultRequest request, String technicianUsername);

    // 6. Generate Lab Report & Final Sign-Off
    LabReportResponse generateLabReport(Long testId, String verifiedByDoctor, String technicianUsername);

    // 7. Cancellation
    LabTestResponse cancelTest(Long testId, LabTestCancelRequest request, String username);

    // 8. Queries with Security & PHI Isolation (Rule 9)
    LabTestResponse getTestById(Long testId, String currentUsername);
    List<LabTestResponse> getTestsByPatient(Long patientId, String currentUsername);
    PagedResponse<LabTestResponse> getTestsByPatientPaged(Long patientId, Pageable pageable, String currentUsername);
    List<LabReportResponse> getReportsByPatient(Long patientId, String currentUsername);
    LabReportResponse getReportByTestId(Long testId, String currentUsername);
    LabReportResponse getReportById(Long reportId, String currentUsername);

    // 9. Worklist & Directory Queries
    PagedResponse<LabTestResponse> getFilteredTests(Long patientId, LabTestStatus status, LabTestCategory category, String search, Pageable pageable);
    List<LabTestResponse> getPendingWorklist(LabTestStatus status);
}
