import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  AlertOctagon,
} from 'lucide-react';
import Swal from 'sweetalert2';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    mobile: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#E2E8F0', width: '0%' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#DC2626', width: '25%' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#D97706', width: '50%' };
    if (score === 3) return { score: 3, label: 'Good', color: '#0284C7', width: '75%' };
    return { score: 4, label: 'Strong', color: '#16A34A', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your full legal name');
      return;
    }
    if (!formData.dateOfBirth) {
      setErrorMessage('Please provide your date of birth');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Please enter your residential address');
      return;
    }
    if (!formData.emergencyContactName.trim() || !formData.emergencyContactPhone.trim()) {
      setErrorMessage('Please provide emergency contact details');
      return;
    }
    if (formData.password.length < 8) {
      setErrorMessage('Password must contain at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your passwords.');
      return;
    }

    setLoading(true);
    try {
      // Role is strictly forced to PATIENT on client and verified on backend
      const user = await register({
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        email: formData.email,
        phone: formData.mobile,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        password: formData.password,
        role: 'PATIENT',
      });

      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: `Patient profile registered under code ${user.patientCode || 'P-100X'}. Please sign in to access your portal.`,
        confirmButtonColor: '#0B5C75',
      }).then(() => {
        navigate('/login');
      });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Email or phone number may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column flex-lg-row bg-slate-50">
      {/* LEFT SIDE: Brand & Patient Onboarding Information */}
      <div className="col-12 col-lg-5 auth-split-bg text-white p-4 p-md-5 d-flex flex-column justify-content-between position-relative">
        <div className="position-relative z-1">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-white p-2.5 rounded-3 text-primary d-flex align-items-center justify-content-center shadow-md">
              <HeartPulse size={28} strokeWidth={2.5} className="text-primary" />
            </div>
            <div>
              <div className="fs-3 fw-bold tracking-tight text-white leading-tight">
                Shree Jeevan
              </div>
              <div className="fs-5 fw-medium text-cyan-200">
                Multispeciality Hospital
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 mt-2">
            <span className="badge bg-teal-800 text-teal-100 border border-teal-600 px-3 py-1 rounded-pill small font-mono d-flex align-items-center gap-1">
              <MapPin size={12} />
              Pune, Maharashtra
            </span>
          </div>
        </div>

        <div className="my-4 position-relative z-1">
          <span className="badge bg-teal-600 text-white px-3 py-1 rounded-pill mb-2 small text-uppercase tracking-wider">
            Patient Portal Onboarding
          </span>
          <h2 className="display-6 fw-bold text-white mb-3">
            Your Health Records, Always at Hand.
          </h2>
          <p className="text-slate-200 lead fs-6 mb-4">
            Register your personal patient account with Shree Jeevan Multispeciality Hospital to book OPD appointments with senior doctors, track lab investigations, access e-prescriptions, and manage digital billing.
          </p>

          <div className="p-3.5 rounded-3 bg-white/10 backdrop-blur border border-white/15">
            <div className="d-flex align-items-center gap-2 mb-2 text-teal-200 fw-semibold">
              <ShieldCheck size={18} />
              <span>Strict Patient Confidentiality</span>
            </div>
            <p className="small text-slate-200 mb-0" style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
              Your electronic medical records (EMR) are isolated according to statutory health privacy guidelines. Only consulting doctors and clinical teams authorized during your treatment can view your diagnostic data.
            </p>
          </div>
        </div>

        <div className="position-relative z-1 pt-3 border-top border-white/15 text-slate-300 small">
          Already registered?{' '}
          <Link to="/login" className="text-white fw-bold text-decoration-underline ms-1">
            Back to Sign In
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE: Patient Registration Form */}
      <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-3 p-md-5 bg-white overflow-y-auto">
        <div className="w-100 py-3" style={{ maxWidth: '580px' }}>
          <div className="mb-4">
            <h3 className="fw-bold text-slate-900 mb-1">Create Patient Account</h3>
            <p className="text-muted small mb-0">
              Fill in your personal details to generate your official Medical Record ID.
              <br />
              <span className="text-primary fw-medium">Note: Staff and Doctor accounts are provisioned by Hospital Administration.</span>
            </p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              {/* Full Name */}
              <div className="col-12">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Full Legal Name *</label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    className="form-control border-slate-200"
                    placeholder="e.g. Aarav Sharma"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Date of Birth & Gender */}
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Date of Birth *</label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                    <Calendar size={16} />
                  </span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="form-control border-slate-200"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Gender *</label>
                <select
                  name="gender"
                  className="form-select border-slate-200"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Email & Mobile */}
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Email Address *</label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="form-control border-slate-200"
                    placeholder="aarav.sharma@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Mobile Number (India) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted font-mono small">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobile"
                    className="form-control border-slate-200"
                    placeholder="98220 12345"
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div className="col-12">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Residential Address *</label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="text"
                    name="address"
                    className="form-control border-slate-200"
                    placeholder="Flat 402, Mayur Vihar, Kothrud, Pune, Maharashtra"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Emergency Contact Name *</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  className="form-control border-slate-200"
                  placeholder="e.g. Sunita Sharma (Spouse)"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold text-slate-700 small mb-1">Emergency Contact Mobile *</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  className="form-control border-slate-200"
                  placeholder="+91 98220 99887"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="col-12 col-sm-6">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fw-semibold text-slate-700 small mb-0">Create Password *</label>
                  {formData.password && (
                    <span className="small font-mono fw-semibold" style={{ color: passwordStrength.color, fontSize: '0.72rem' }}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-control border-slate-200"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-slate-200 bg-slate-50 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength meter */}
                <div className="password-strength-track">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: passwordStrength.width,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="col-12 col-sm-6">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fw-semibold text-slate-700 small mb-0">Confirm Password *</label>
                  {formData.confirmPassword && (
                    <span
                      className="small fw-semibold"
                      style={{
                        color: formData.password === formData.confirmPassword ? '#16A34A' : '#DC2626',
                        fontSize: '0.72rem',
                      }}
                    >
                      {formData.password === formData.confirmPassword ? '✓ Match' : '✗ No Match'}
                    </span>
                  )}
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="form-control border-slate-200"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-slate-200 bg-slate-50 text-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2.5 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mt-4 fw-semibold"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Patient Registration</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center text-muted small mt-3">
              Already have an account?{' '}
              <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: '#0F766E' }}>
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
