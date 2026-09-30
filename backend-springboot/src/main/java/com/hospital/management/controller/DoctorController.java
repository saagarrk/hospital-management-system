package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.doctor.DoctorRequest;
import com.hospital.management.dto.doctor.DoctorResponse;
import com.hospital.management.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Doctors", description = "Doctor directory, department affiliations, specialties, OPD consultation fees, and schedule slots")
@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @Operation(summary = "Onboard new doctor", description = "Creates a doctor clinical profile with department affiliation, consultation fee, and schedule.")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(@Valid @RequestBody DoctorRequest request) {
        DoctorResponse response = doctorService.createDoctor(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Doctor profile onboarded successfully"), HttpStatus.CREATED);
    }

    @Operation(summary = "Update doctor details", description = "Updates doctor consultation fee, qualification, department, or schedule availability.")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorRequest request) {
        DoctorResponse response = doctorService.updateDoctor(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor details updated successfully"));
    }

    @Operation(summary = "Get doctor by ID", description = "Retrieves doctor profile details including OPD timings and room number.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        DoctorResponse response = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get doctors by department", description = "Lists all attending doctors assigned to a specific hospital department.")
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getDoctorsByDepartment(@PathVariable Long departmentId) {
        List<DoctorResponse> responses = doctorService.getDoctorsByDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @Operation(summary = "Search doctors with pagination", description = "Search doctors by name or specialization, with optional department filter and pagination.")
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<DoctorResponse>>> searchDoctors(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<DoctorResponse> response = doctorService.searchDoctors(departmentId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
