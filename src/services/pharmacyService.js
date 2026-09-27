import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

export const pharmacyService = {
  getMedicines: async (params = {}) => {
    try {
      const response = await axiosClient.get('/pharmacy/medicines', { params });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getMedicines();
    }
  },

  getMedicineById: async (id) => {
    try {
      const response = await axiosClient.get(`/pharmacy/medicines/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.getMedicines().find((m) => m.id === Number(id));
    }
  },

  updateStock: async (id, quantityChange, reason) => {
    try {
      const response = await axiosClient.post(`/pharmacy/medicines/${id}/stock`, {
        quantityChange,
        reason,
      });
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.updateStock(id, quantityChange, reason);
    }
  },

  addMedicine: async (medicineData) => {
    try {
      const response = await axiosClient.post('/pharmacy/medicines', medicineData);
      return response.data?.data || response.data;
    } catch (err) {
      return mockDataService.addMedicine(medicineData);
    }
  },
};

export default pharmacyService;
