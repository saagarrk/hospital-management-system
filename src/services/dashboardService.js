import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

/**
 * Enterprise Dashboard Aggregation Client Service
 * Calls backend Spring Boot aggregation endpoints with seamless fallback to client mock engine
 */
export const dashboardService = {
  getAdminDashboard: async () => {
    try {
      const response = await axiosClient.get('/dashboard/admin');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback to client aggregation service
    }
    return mockDataService.getAdminDashboardStats();
  },

  getDoctorDashboard: async (doctorId = null) => {
    try {
      const url = doctorId ? `/dashboard/doctor/${doctorId}` : '/dashboard/doctor';
      const response = await axiosClient.get(url);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }
    return mockDataService.getDoctorDashboardStats(doctorId);
  },

  getReceptionistDashboard: async () => {
    try {
      const response = await axiosClient.get('/dashboard/receptionist');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }
    return mockDataService.getReceptionistDashboardStats();
  },

  getNurseDashboard: async () => {
    try {
      const response = await axiosClient.get('/dashboard/nurse');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }
    return mockDataService.getNurseDashboardStats();
  },

  getPharmacistDashboard: async () => {
    try {
      const response = await axiosClient.get('/dashboard/pharmacist');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }
    return mockDataService.getPharmacistDashboardStats();
  },

  getLabTechnicianDashboard: async () => {
    try {
      const response = await axiosClient.get('/dashboard/lab-technician');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }
    return mockDataService.getLabTechnicianDashboardStats();
  },

  getPatientDashboard: async (patientId = null) => {
    try {
      const url = patientId ? `/dashboard/patient/${patientId}` : '/dashboard/patient';
      const response = await axiosClient.get(url);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }
    return mockDataService.getPatientDashboardStats(patientId);
  },
};
