import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const patientService = {
  getPatients: async (params = {}) => {
    try {
      const response = await axiosClient.get('/patients', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getPatients();
    }
  },

  getPatientById: async (id) => {
    try {
      const response = await axiosClient.get(`/patients/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getPatientById(id);
    }
  },

  registerPatient: async (patientData) => {
    try {
      const response = await axiosClient.post('/patients', patientData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.addPatient(patientData);
    }
  },

  updatePatient: async (id, patientData) => {
    try {
      const response = await axiosClient.put(`/patients/${id}`, patientData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.updatePatient(id, patientData);
    }
  },
};

export default patientService;
