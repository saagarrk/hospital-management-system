import axiosClient from '../api/axiosClient';

/**
 * Authentication Service for Spring Boot backend integration
 * Handles login, registration, password recovery, and token management
 */
export const authService = {
  login: async (usernameOrEmail, password) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        usernameOrEmail: usernameOrEmail.trim(),
        password: password,
      });
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axiosClient.post('/auth/forgot-password', {
        email: email.trim(),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (resetToken, newPassword) => {
    try {
      const response = await axiosClient.post('/auth/reset-password', {
        resetToken: resetToken.trim(),
        newPassword: newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('hms_jwt_token');
      if (token) {
        await axiosClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore network errors on logout
    }
  },
};
