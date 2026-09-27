package com.hospital.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hospital.management.dto.appointment.AppointmentBookingRequest;
import com.hospital.management.dto.appointment.AppointmentResponse;
import com.hospital.management.enums.AppointmentStatus;
import com.hospital.management.exception.AppointmentConflictException;
import com.hospital.management.exception.GlobalExceptionHandler;
import com.hospital.management.service.AppointmentService;
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
import java.time.LocalTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentController REST Endpoint Integration Tests")
class AppointmentControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private AppointmentService appointmentService;

    @InjectMocks
    private AppointmentController appointmentController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(appointmentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("POST /api/appointments - Success (HTTP 201 Created)")
    void bookAppointment_Success() throws Exception {
        LocalDate date = LocalDate.now().plusDays(3);
        LocalTime time = LocalTime.of(10, 0);

        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(2L);
        request.setAppointmentDate(date);
        request.setAppointmentTime(time);
        request.setReason("Consultation");

        AppointmentResponse response = AppointmentResponse.builder()
                .id(100L)
                .doctorName("Dr. House")
                .patientName("John Doe")
                .appointmentDate(date)
                .appointmentTime(time)
                .status(AppointmentStatus.PENDING)
                .build();

        when(appointmentService.bookAppointment(any(AppointmentBookingRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/appointments - Conflict Detected (HTTP 409 Conflict)")
    void bookAppointment_Conflict_Returns409() throws Exception {
        LocalDate date = LocalDate.now().plusDays(3);
        LocalTime time = LocalTime.of(10, 0);

        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(2L);
        request.setAppointmentDate(date);
        request.setAppointmentTime(time);

        when(appointmentService.bookAppointment(any(AppointmentBookingRequest.class)))
                .thenThrow(new AppointmentConflictException("Dr. House", date, time.toString()));

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("CONFLICT"))
                .andExpect(jsonPath("$.message").contains("Dr. House already has an active appointment"));
    }

    @Test
    @DisplayName("PATCH /api/appointments/{id}/cancel - Success (HTTP 200 OK)")
    void cancelAppointment_Success() throws Exception {
        AppointmentResponse response = AppointmentResponse.builder()
                .id(100L)
                .status(AppointmentStatus.CANCELLED)
                .cancellationReason("Patient requested cancellation")
                .build();

        when(appointmentService.cancelAppointment(eq(100L), any())).thenReturn(response);

        mockMvc.perform(patch("/api/appointments/100/cancel")
                        .param("reason", "Patient requested cancellation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}
