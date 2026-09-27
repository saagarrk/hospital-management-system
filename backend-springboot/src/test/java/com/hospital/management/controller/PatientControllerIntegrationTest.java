package com.hospital.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hospital.management.dto.patient.PatientRequest;
import com.hospital.management.dto.patient.PatientResponse;
import com.hospital.management.enums.Gender;
import com.hospital.management.exception.DuplicateResourceException;
import com.hospital.management.exception.GlobalExceptionHandler;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.service.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientController REST Endpoint Integration Tests")
class PatientControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private PatientService patientService;

    @InjectMocks
    private PatientController patientController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(patientController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("POST /api/patients - Success (HTTP 201 Created)")
    void createPatient_Success() throws Exception {
        PatientRequest request = new PatientRequest();
        request.setName("Alice Smith");
        request.setPhone("555-0100");
        request.setEmail("alice@hospital.com");
        request.setGender(Gender.FEMALE);
        request.setDateOfBirth(LocalDate.of(1990, 1, 1));

        PatientResponse response = PatientResponse.builder()
                .id(1L)
                .patientCode("PT-0001")
                .name("Alice Smith")
                .phone("555-0100")
                .build();

        when(patientService.createPatient(any(PatientRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.patientCode").value("PT-0001"))
                .andExpect(jsonPath("$.data.name").value("Alice Smith"));
    }

    @Test
    @DisplayName("POST /api/patients - Duplicate Phone Conflict (HTTP 409)")
    void createPatient_DuplicatePhone_ReturnsConflict() throws Exception {
        PatientRequest request = new PatientRequest();
        request.setName("Alice Smith");
        request.setPhone("555-0100");
        request.setGender(Gender.FEMALE);
        request.setDateOfBirth(LocalDate.of(1990, 1, 1));

        when(patientService.createPatient(any(PatientRequest.class)))
                .thenThrow(new DuplicateResourceException("A patient with mobile number 555-0100 is already registered."));

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("A patient with mobile number 555-0100 is already registered."));
    }

    @Test
    @DisplayName("GET /api/patients/{id} - Success (HTTP 200 OK)")
    void getPatientById_Success() throws Exception {
        PatientResponse response = PatientResponse.builder()
                .id(1L)
                .patientCode("PT-0001")
                .name("Alice Smith")
                .build();

        when(patientService.getPatientById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/patients/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.patientCode").value("PT-0001"));
    }

    @Test
    @DisplayName("GET /api/patients/{id} - Not Found (HTTP 404)")
    void getPatientById_NotFound_Returns404() throws Exception {
        when(patientService.getPatientById(999L))
                .thenThrow(new ResourceNotFoundException("Patient", "id", 999L));

        mockMvc.perform(get("/api/patients/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").contains("Patient not found with id : '999'"));
    }
}
