/**
 * Client-side form validation utilities
 */

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  if (cleanPhone.length < 10) {
    return 'Please enter a valid 10-digit mobile number';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'None', color: 'bg-secondary' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-danger' };
  if (score <= 3) return { score: 50, label: 'Fair', color: 'bg-warning' };
  if (score <= 4) return { score: 75, label: 'Good', color: 'bg-info' };
  return { score: 100, label: 'Strong', color: 'bg-success' };
};
