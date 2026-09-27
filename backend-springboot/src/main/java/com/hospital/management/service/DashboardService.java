package com.hospital.management.service;

import com.hospital.management.dto.dashboard.*;

public interface DashboardService {
    AdminDashboardResponse getAdminDashboard();
    DoctorDashboardResponse getDoctorDashboard(Long doctorId);
    ReceptionistDashboardResponse getReceptionistDashboard();
    PharmacistDashboardResponse getPharmacistDashboard();
    LabTechnicianDashboardResponse getLabTechnicianDashboard();
    PatientDashboardResponse getPatientDashboard(Long patientId);
}
