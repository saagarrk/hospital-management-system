import axios from 'axios';
import Swal from 'sweetalert2';

// Create configured Axios instance
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT Bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors with SweetAlert2
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    if (status === 401) {
      Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Please log in again to continue.',
        confirmButtonColor: '#0d6efd',
      });
      localStorage.removeItem('hms_jwt_token');
      localStorage.removeItem('hms_user');
    } else if (status === 409) {
      // Rule conflict (e.g. double booked appointment or occupied bed)
      Swal.fire({
        icon: 'error',
        title: 'Conflict Detected (HTTP 409)',
        text: message,
        confirmButtonColor: '#dc3545',
      });
    } else if (status === 403) {
      Swal.fire({
        icon: 'error',
        title: 'Access Forbidden (HTTP 403)',
        text: message,
        confirmButtonColor: '#dc3545',
      });
    } else if (status === 400) {
      Swal.fire({
        icon: 'warning',
        title: 'Business Rule Violation (HTTP 400)',
        text: message,
        confirmButtonColor: '#ffc107',
      });
    } else if (status === 404) {
      Swal.fire({
        icon: 'info',
        title: 'Resource Not Found (HTTP 404)',
        text: message,
        confirmButtonColor: '#0d6efd',
      });
    } else if (status === 500) {
      Swal.fire({
        icon: 'error',
        title: 'Server Error (HTTP 500)',
        text: message,
        confirmButtonColor: '#dc3545',
      });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
