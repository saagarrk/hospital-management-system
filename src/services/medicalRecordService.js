import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const medicalRecordService = {
  getRecords: async (params = {}) => {
    try {
      const response = await axiosClient.get('/medical-records', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getRecords();
    }
  },

  getRecordById: async (id) => {
    try {
      const response = await axiosClient.get(`/medical-records/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getRecordById(id);
    }
  },

  createRecord: async (recordData) => {
    try {
      const response = await axiosClient.post('/medical-records', recordData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.addRecord(recordData);
    }
  },

  updateRecord: async (id, recordData) => {
    try {
      const response = await axiosClient.put(`/medical-records/${id}`, recordData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.updateRecord(id, recordData);
    }
  },
};

export default medicalRecordService;
