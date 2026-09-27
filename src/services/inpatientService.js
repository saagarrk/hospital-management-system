import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const inpatientService = {
  getAdmissions: async (params = {}) => {
    try {
      const response = await axiosClient.get('/inpatient/admissions', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getAdmissions();
    }
  },

  getBeds: async (params = {}) => {
    try {
      const response = await axiosClient.get('/inpatient/beds', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getBeds();
    }
  },

  admitPatient: async (admissionData) => {
    try {
      const response = await axiosClient.post('/inpatient/admissions', admissionData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.admitPatient(admissionData);
    }
  },

  transferBed: async (admissionId, targetBedId, reason) => {
    try {
      const response = await axiosClient.post(`/inpatient/admissions/${admissionId}/transfer`, {
        targetBedId,
        reason,
      });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.transferBed(admissionId, targetBedId, reason);
    }
  },

  dischargePatient: async (admissionId, dischargeData) => {
    try {
      const response = await axiosClient.post(`/inpatient/admissions/${admissionId}/discharge`, dischargeData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.dischargePatient(admissionId, dischargeData);
    }
  },
};

export default inpatientService;
