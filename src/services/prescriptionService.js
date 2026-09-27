import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const prescriptionService = {
  getPrescriptions: async (params = {}) => {
    try {
      const response = await axiosClient.get('/prescriptions', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getPrescriptions();
    }
  },

  getPrescriptionById: async (id) => {
    try {
      const response = await axiosClient.get(`/prescriptions/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getPrescriptionById(id);
    }
  },

  createPrescription: async (prescriptionData) => {
    try {
      const response = await axiosClient.post('/prescriptions', prescriptionData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.addPrescription(prescriptionData);
    }
  },

  dispensePrescription: async (id, notes) => {
    try {
      const response = await axiosClient.post(`/prescriptions/${id}/dispense`, { notes });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.dispensePrescription(id, notes);
    }
  },
};

export default prescriptionService;
