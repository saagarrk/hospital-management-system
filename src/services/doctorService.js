import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const doctorService = {
  getDoctors: async (params = {}) => {
    try {
      const response = await axiosClient.get('/doctors', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getDoctors();
    }
  },

  getDoctorById: async (id) => {
    try {
      const response = await axiosClient.get(`/doctors/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getDoctors().find((d) => d.id === Number(id));
    }
  },

  getDoctorSchedule: async (id) => {
    try {
      const response = await axiosClient.get(`/doctors/${id}/schedule`);
      return response.data?.data || response.data;
    } catch (err) {
      const doc = mockDataService.getDoctors().find((d) => d.id === Number(id));
      return doc ? { availableDays: doc.availableDays, startTime: doc.startTime, endTime: doc.endTime } : null;
    }
  },
};

export default doctorService;
