import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const appointmentService = {
  getAppointments: async (params = {}) => {
    try {
      const response = await axiosClient.get('/appointments', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getAppointments();
    }
  },

  getAppointmentById: async (id) => {
    try {
      const response = await axiosClient.get(`/appointments/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getAppointmentById(id);
    }
  },

  bookAppointment: async (appointmentData) => {
    try {
      const response = await axiosClient.post('/appointments', appointmentData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.createAppointment(appointmentData);
    }
  },

  rescheduleAppointment: async (id, rescheduleData) => {
    try {
      const response = await axiosClient.put(`/appointments/${id}/reschedule`, rescheduleData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.rescheduleAppointment(id, rescheduleData.newDate, rescheduleData.newTime, rescheduleData.notes);
    }
  },

  cancelAppointment: async (id, reason) => {
    try {
      const response = await axiosClient.patch(`/appointments/${id}/cancel`, { reason });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.cancelAppointment(id, reason);
    }
  },

  completeAppointment: async (id, notes) => {
    try {
      const response = await axiosClient.patch(`/appointments/${id}/complete`, { clinicalNotes: notes });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.completeAppointment(id, notes);
    }
  },
};

export default appointmentService;
