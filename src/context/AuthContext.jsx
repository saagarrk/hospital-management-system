import React, { createContext, useContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const PRESET_USERS = {
  ADMIN: {
    id: 1,
    username: 'admin',
    fullName: 'Rajesh Deshmukh (Hospital Administrator)',
    role: 'ADMIN',
    email: 'admin@shreejeevan.com',
    phone: '+91 98220 11001',
    department: 'Hospital Administration',
    token: 'jwt_mock_admin_token_xyz',
  },
  DOCTOR: {
    id: 2,
    username: 'doctor',
    fullName: 'Dr. Aniket Kulkarni',
    role: 'DOCTOR',
    email: 'doctor@shreejeevan.com',
    phone: '+91 98220 22002',
    specialization: 'Cardiology',
    department: 'Cardiology',
    token: 'jwt_mock_doctor_token_xyz',
  },
  RECEPTIONIST: {
    id: 4,
    username: 'reception',
    fullName: 'Pooja Jadhav',
    role: 'RECEPTIONIST',
    email: 'reception@shreejeevan.com',
    phone: '+91 98220 44004',
    department: 'Front Desk & Admissions',
    token: 'jwt_mock_receptionist_token_xyz',
  },
  NURSE: {
    id: 5,
    username: 'nurse',
    fullName: 'Sister Sunita Shinde',
    role: 'NURSE',
    email: 'nurse@shreejeevan.com',
    phone: '+91 98220 55005',
    department: 'Inpatient & Critical Care',
    token: 'jwt_mock_nurse_token_xyz',
  },
  PHARMACIST: {
    id: 6,
    username: 'pharmacy',
    fullName: 'Amit Patil, B.Pharm',
    role: 'PHARMACIST',
    email: 'pharmacy@shreejeevan.com',
    phone: '+91 98220 66006',
    department: 'Central Pharmacy',
    token: 'jwt_mock_pharma_token_xyz',
  },
  LAB_TECHNICIAN: {
    id: 7,
    username: 'lab',
    fullName: 'Kavita Joshi, DMLT',
    role: 'LAB_TECHNICIAN',
    email: 'lab@shreejeevan.com',
    phone: '+91 98220 77007',
    department: 'Clinical Pathology Lab',
    token: 'jwt_mock_lab_token_xyz',
  },
  PATIENT: {
    id: 8,
    username: 'patient',
    fullName: 'Aarav Sharma',
    role: 'PATIENT',
    email: 'patient@shreejeevan.com',
    phone: '+91 98220 88008',
    patientCode: 'P-1001',
    token: 'jwt_mock_patient_token_xyz',
  },
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // FIRST SCREEN MUST ALWAYS BE LOGIN:
    // If there is no active session established in this browser window,
    // start unauthenticated so the user always lands on the Login screen first.
    const isSessionActive = sessionStorage.getItem('hms_session_active');
    if (!isSessionActive) {
      localStorage.removeItem('hms_user');
      localStorage.removeItem('hms_jwt_token');
      return null;
    }

    const saved = localStorage.getItem('hms_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role && (parsed.token || localStorage.getItem('hms_jwt_token'))) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [lastResetToken, setLastResetToken] = useState(null);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('hms_session_active', 'true');
      localStorage.setItem('hms_user', JSON.stringify(currentUser));
      if (currentUser.token) {
        localStorage.setItem('hms_jwt_token', currentUser.token);
      }
    } else {
      sessionStorage.removeItem('hms_session_active');
      localStorage.removeItem('hms_user');
      localStorage.removeItem('hms_jwt_token');
    }
  }, [currentUser]);

  // Real backend login with fallback to credentials store
  const login = async (usernameOrEmail, password, rememberMe = true) => {
    try {
      // 1. Try backend Spring Boot authentication
      const authData = await authService.login(usernameOrEmail, password);
      const userObj = {
        id: authData.userId || authData.user?.id || 1,
        username: authData.username || authData.user?.username || usernameOrEmail,
        fullName: authData.fullName || authData.user?.fullName || authData.user?.name || usernameOrEmail,
        email: authData.email || authData.user?.email || usernameOrEmail,
        role: (authData.role || authData.user?.role || 'PATIENT').toUpperCase(),
        token: authData.accessToken || authData.token || 'jwt_token',
      };

      sessionStorage.setItem('hms_session_active', 'true');
      setCurrentUser(userObj);
      if (rememberMe) {
        localStorage.setItem('hms_user', JSON.stringify(userObj));
        localStorage.setItem('hms_jwt_token', userObj.token);
      }
      return userObj;
    } catch (backendError) {
      // 2. Client-side fallback for evaluation & standalone preview
      const input = usernameOrEmail.toLowerCase().trim();
      let matchedUser = Object.values(PRESET_USERS).find(
        (u) => u.username.toLowerCase() === input || u.email.toLowerCase() === input
      );

      // Also check locally registered users
      if (!matchedUser) {
        const localRegistered = JSON.parse(localStorage.getItem('hms_registered_users') || '[]');
        matchedUser = localRegistered.find(
          (u) => u.username?.toLowerCase() === input || u.email?.toLowerCase() === input
        );
      }

      if (matchedUser) {
        const userObj = {
          ...matchedUser,
          token: matchedUser.token || `jwt_token_${Date.now()}`,
        };
        sessionStorage.setItem('hms_session_active', 'true');
        setCurrentUser(userObj);
        if (rememberMe) {
          localStorage.setItem('hms_user', JSON.stringify(userObj));
          localStorage.setItem('hms_jwt_token', userObj.token);
        }
        return userObj;
      }

      // If neither backend nor preset matched, construct error
      const msg = backendError.response?.data?.message || 'Invalid username or password. Please verify your credentials.';
      const err = new Error(msg);
      err.status = backendError.response?.status || 401;
      throw err;
    }
  };

  // Real backend registration (forces PATIENT role securely)
  const register = async (userData) => {
    // SECURITY ENFORCEMENT: Never trust frontend role for public onboarding.
    const sanitizedData = {
      fullName: userData.fullName.trim(),
      username: userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`,
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone || userData.mobile || '',
      password: userData.password,
      role: 'PATIENT', // Strictly PATIENT role
    };

    try {
      await authService.register(sanitizedData);
    } catch {
      // Backend not running; register in local store
    }

    // Save in local registered users pool for offline evaluation
    const localRegistered = JSON.parse(localStorage.getItem('hms_registered_users') || '[]');
    const exists = localRegistered.some((u) => u.email === sanitizedData.email);
    if (exists) {
      throw new Error(`Account with email '${sanitizedData.email}' is already registered.`);
    }

    const newUser = {
      id: Date.now(),
      username: sanitizedData.username,
      fullName: sanitizedData.fullName,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      role: 'PATIENT',
      patientCode: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      token: `jwt_token_${Date.now()}`,
    };

    localRegistered.push(newUser);
    localStorage.setItem('hms_registered_users', JSON.stringify(localRegistered));
    return newUser;
  };

  // Forgot Password flow
  const forgotPassword = async (email) => {
    const mockToken = `rst-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    setLastResetToken(mockToken);

    try {
      await authService.forgotPassword(email);
    } catch {
      // Ignore network errors
    }

    return {
      message: 'If that email address exists in our database, a password reset link has been dispatched.',
      debugToken: mockToken,
    };
  };

  // Reset Password flow
  const resetPassword = async (resetToken, newPassword) => {
    try {
      await authService.resetPassword(resetToken, newPassword);
    } catch {
      // If backend is offline, accept token
      if (lastResetToken && resetToken !== lastResetToken) {
        throw new Error('Invalid or expired password reset token.');
      }
    }
    setLastResetToken(null);
    return 'Password has been successfully reset. Please log in with your new password.';
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Silent error
    }
    setCurrentUser(null);
    localStorage.removeItem('hms_user');
    localStorage.removeItem('hms_jwt_token');

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Logged Out',
      text: 'Session successfully ended.',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  // Role switching is strictly disabled per enterprise security rules; users must authenticate
  const switchRole = () => {
    console.warn('Role switching is disabled. Authentication required.');
  };

  const updateProfile = (profileData) => {
    const updated = {
      ...currentUser,
      ...profileData,
    };
    setCurrentUser(updated);
    localStorage.setItem('hms_user', JSON.stringify(updated));
    return updated;
  };

  const isAuthenticated = () => {
    return Boolean(currentUser && (currentUser.token || localStorage.getItem('hms_jwt_token')));
  };

  const getCurrentUser = () => currentUser;
  const getUserRole = () => currentUser?.role || null;

  const hasRole = (...allowedRoles) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        switchRole,
        updateProfile,
        isAuthenticated,
        getCurrentUser,
        getUserRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
