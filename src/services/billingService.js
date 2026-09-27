import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const billingService = {
  getBills: async (params = {}) => {
    try {
      const response = await axiosClient.get('/billing/invoices', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getBills();
    }
  },

  getBillById: async (id) => {
    try {
      const response = await axiosClient.get(`/billing/invoices/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getBillById(id);
    }
  },

  createBill: async (billData) => {
    try {
      const response = await axiosClient.post('/billing/invoices', billData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.createBill(billData);
    }
  },

  recordPayment: async (billId, paymentData) => {
    try {
      const response = await axiosClient.post(`/billing/invoices/${billId}/payments`, paymentData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.processPayment(billId, paymentData.amount, paymentData.paymentMethod);
    }
  },
};

export default billingService;
