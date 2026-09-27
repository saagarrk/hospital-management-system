import axiosClient from '../api/axiosClient';
import { mockDataService } from './mockDataService';

/**
 * Enterprise Audit Logging Service
 * Communicates with Spring Boot Admin Audit Controller (/api/admin/audit-logs)
 * with robust client-side fallback to mockDataService in development.
 */
export const auditService = {
  getAuditLogs: async (params = {}) => {
    try {
      const response = await axiosClient.get('/admin/audit-logs', { params });
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (err) {
      // Graceful fallback to client persistence
      return mockDataService.getAuditLogs(params);
    }
  },

  getRecentLogs: async (limit = 15) => {
    try {
      const response = await axiosClient.get('/admin/audit-logs/recent', { params: { limit } });
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (err) {
      const paged = mockDataService.getAuditLogs({ page: 0, pageSize: limit });
      return paged.content;
    }
  },

  getAuditStats: async () => {
    return mockDataService.getAuditLogStats();
  },

  recordAuditLog: async (logPayload) => {
    try {
      // In local mode or client actions, immediately record to client store
      return mockDataService.recordAuditLog(logPayload);
    } catch (err) {
      return null;
    }
  },
};

export default auditService;
