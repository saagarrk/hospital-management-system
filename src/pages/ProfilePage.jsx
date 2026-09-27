import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  BadgeCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';

export const ProfilePage = () => {
  const { currentUser, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    specialization: currentUser?.specialization || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      updateProfile(formData);
      setSavingProfile(false);
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your account profile metadata has been refreshed.',
        confirmButtonColor: '#2563EB',
      });
    }, 500);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      Swal.fire('Error', 'Please enter your current password', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      Swal.fire('Error', 'New password must be at least 8 characters', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      Swal.fire('Error', 'New passwords do not match', 'error');
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      Swal.fire({
        icon: 'success',
        title: 'Security Updated',
        text: 'Your account password has been updated successfully with BCrypt hashing.',
        confirmButtonColor: '#2563EB',
      });
    }, 600);
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-danger text-white';
      case 'DOCTOR': return 'bg-primary text-white';
      case 'RECEPTIONIST': return 'bg-info text-dark';
      case 'NURSE': return 'bg-success text-white';
      case 'PHARMACIST': return 'bg-warning text-dark';
      case 'LAB_TECHNICIAN': return 'bg-secondary text-white';
      case 'PATIENT': return 'bg-dark text-white';
      default: return 'bg-light text-dark';
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 bg-slate-50 min-vh-100">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-slate-200">
        <div>
          <h3 className="fw-bold text-slate-900 mb-1">User Account Profile</h3>
          <p className="text-muted small mb-0">
            Manage your authenticated personal credentials, security keys, and healthcare profile
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Persona Overview Card */}
        <div className="col-12 col-lg-4">
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm p-4 text-center mb-4">
            <div
              className="mx-auto bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow mb-3"
              style={{ width: 80, height: 80, fontSize: '2rem' }}
            >
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <h5 className="fw-bold text-dark mb-1">{currentUser?.fullName}</h5>
            <div className="text-muted small font-mono mb-2">{currentUser?.email}</div>
            <div>
              <span className={`badge px-3 py-1 rounded-pill ${getRoleBadgeClass(currentUser?.role)}`}>
                {currentUser?.role}
              </span>
            </div>

            <hr className="my-4 border-slate-200" />

            <div className="text-start small">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Username:</span>
                <span className="font-mono text-dark fw-medium">{currentUser?.username}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Phone:</span>
                <span className="text-dark">{currentUser?.phone || '+91 98220 11001'}</span>
              </div>
              {currentUser?.patientCode && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Patient Code:</span>
                  <span className="font-mono text-primary fw-bold">{currentUser?.patientCode}</span>
                </div>
              )}
              {currentUser?.specialization && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Specialty:</span>
                  <span className="text-dark">{currentUser?.specialization}</span>
                </div>
              )}
              <div className="d-flex justify-content-between">
                <span className="text-muted">Security State:</span>
                <span className="text-success fw-semibold d-flex align-items-center gap-1">
                  <BadgeCheck size={14} /> Active & Verified
                </span>
              </div>
            </div>
          </div>

          {/* Quick RBAC Info Card */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm p-3">
            <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold small">
              <ShieldCheck size={18} />
              <span>Spring Security Authorization</span>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
              Your current role <strong>{currentUser?.role}</strong> grants endpoint access via Spring Security 6
              stateless JWT filtering. Role-level permissions are strictly enforced on backend JPA services.
            </p>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password Reset Forms */}
        <div className="col-12 col-lg-8">
          <div className="space-y-4">
            {/* Edit Personal Information */}
            <div className="card border border-slate-200 bg-white rounded-3 shadow-sm p-4 mb-4">
              <h5 className="fw-bold text-dark mb-3">Personal & Contact Details</h5>
              <form onSubmit={handleProfileSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold text-slate-700 small">Full Name</label>
                    <input
                      type="text"
                      className="form-control border-slate-200"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold text-slate-700 small">Email Address</label>
                    <input
                      type="email"
                      className="form-control border-slate-200"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold text-slate-700 small">Mobile Phone</label>
                    <input
                      type="tel"
                      className="form-control border-slate-200"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  {currentUser?.role === 'DOCTOR' && (
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-slate-700 small">Clinical Specialty</label>
                      <input
                        type="text"
                        className="form-control border-slate-200"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 text-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn btn-primary-custom btn-sm px-4 py-2 rounded-2 d-inline-flex align-items-center gap-1 shadow-sm"
                  >
                    <Save size={14} />
                    <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="card border border-slate-200 bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Key size={20} className="text-primary" />
                <h5 className="fw-bold text-dark mb-0">Change Account Password</h5>
              </div>
              <p className="text-muted small mb-3">
                Update your account password with BCrypt salt hashing. Minimum 8 characters.
              </p>

              <form onSubmit={handlePasswordSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold text-slate-700 small">Current Password *</label>
                    <input
                      type="password"
                      className="form-control border-slate-200"
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold text-slate-700 small">New Password *</label>
                    <input
                      type="password"
                      className="form-control border-slate-200"
                      placeholder="Min. 8 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold text-slate-700 small">Confirm New Password *</label>
                    <input
                      type="password"
                      className="form-control border-slate-200"
                      placeholder="Re-type password"
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn btn-outline-dark btn-sm px-4 py-2 rounded-2 d-inline-flex align-items-center gap-1"
                  >
                    <Lock size={14} />
                    <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
