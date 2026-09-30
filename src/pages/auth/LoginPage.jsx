import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, PRESET_USERS } from '../../context/AuthContext';
import {
  HeartPulse,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FlaskConical,
  CreditCard,
  Building2,
  MapPin,
  KeyRound,
  FileText,
} from 'lucide-react';
import Swal from 'sweetalert2';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(usernameOrEmail, password, rememberMe);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Authentication Successful',
        text: `Welcome back, ${user.fullName}`,
        showConfirmButton: false,
        timer: 1800,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fill demo credentials into form for evaluation
  const fillDemoAccount = (roleKey) => {
    const preset = PRESET_USERS[roleKey];
    if (preset) {
      setUsernameOrEmail(preset.email);
      setPassword('Demo@123');
      setErrorMessage('');
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column flex-lg-row bg-slate-50">
      {/* LEFT SIDE: Premium Healthcare Visual & Brand Showcase */}
      <div className="col-12 col-lg-6 auth-split-bg text-white p-4 p-md-5 d-flex flex-column justify-content-between position-relative">
        {/* Brand header */}
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
            <span className="text-cyan-200 small fst-italic">
              "Compassionate Care. Trusted Healthcare."
            </span>
          </div>
        </div>

        {/* Center Tagline & Feature Highlights */}
        <div className="my-4 position-relative z-1" style={{ maxWidth: '540px' }}>
          <h1 className="display-6 fw-extrabold text-white mb-2 text-balance leading-tight">
            Advanced Clinical Care.
            <br />
            Integrated Hospital System.
          </h1>
          <p className="text-slate-200 fs-6 mb-4 lead">
            A state-of-the-art enterprise health management system built for doctors, clinical staff, 
            and patients with seamless electronic medical records, appointments, pharmacy, and billing.
          </p>

          <div className="row g-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Secure Patient Records',
                desc: 'Role-based access control, HIPAA compliance & patient health data isolation.',
              },
              {
                icon: Calendar,
                title: 'Smart Appointment Management',
                desc: 'Real-time OPD slots, doctor availability calendars & conflict detection.',
              },
              {
                icon: FlaskConical,
                title: 'Integrated Laboratory',
                desc: 'Digital pathology test ordering, sample barcode tracking & instant lab reports.',
              },
              {
                icon: CreditCard,
                title: 'Digital Billing & Pharmacy',
                desc: 'Automated itemized billing, Indian Rupee (₹) calculations, UPI payments & medicine stock management.',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="col-12 col-sm-6">
                  <div className="p-3 rounded-3 bg-white/10 backdrop-blur border border-white/15 h-100">
                    <div className="d-flex align-items-center gap-2 mb-1 text-teal-300">
                      <Icon size={18} />
                      <strong className="text-white small">✓ {f.title}</strong>
                    </div>
                    <p className="text-slate-200 small mb-0" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="position-relative z-1 pt-3 border-top border-white/15 d-flex flex-wrap align-items-center justify-content-between text-slate-300 small">
          <span>Shree Jeevan Multispeciality Hospital &copy; {new Date().getFullYear()}</span>
          <span>Pune, Maharashtra · NABH Accredited Facility</span>
        </div>
      </div>

      {/* RIGHT SIDE: Modern Login Card */}
      <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-3 p-md-5 bg-white">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          {/* Form Header */}
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-circle bg-primary-subtle text-primary mb-3 shadow-sm">
              <HeartPulse size={30} className="text-primary" />
            </div>
            <h3 className="fw-bold text-slate-900 mb-1">Welcome Back</h3>
            <p className="text-muted small mb-0">Sign in to your hospital account</p>
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email / Username */}
            <div className="mb-3">
              <label className="form-label fw-semibold text-slate-700 small">Email or Username</label>
              <div className="input-group">
                <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                  <Mail size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-slate-200"
                  placeholder="admin@shreejeevan.com or username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fw-semibold text-slate-700 small mb-0">Password</label>
                <Link to="/forgot-password" className="text-decoration-none small fw-medium" style={{ color: '#0F766E' }}>
                  Forgot Password?
                </Link>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-slate-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-slate-200 bg-slate-50 text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="mb-4 d-flex align-items-center justify-content-between">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMeCheck"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label text-slate-600 small" htmlFor="rememberMeCheck">
                  Remember me
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2.5 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3 fw-semibold"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center text-muted small">
              Don't have an account?{' '}
              <Link to="/register" className="fw-semibold text-decoration-none" style={{ color: '#0F766E' }}>
                Register as Patient
              </Link>
            </div>
          </form>

          {/* Development Demo Accounts Helper */}
          <div className="mt-4 pt-3 border-top border-slate-200">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-slate-100 text-slate-700 border border-slate-200 small font-mono">
                Development Demo Accounts
              </span>
              <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                Password: <code>Demo@123</code>
              </span>
            </div>
            <p className="text-muted small mb-2" style={{ fontSize: '0.72rem' }}>
              Click any demo persona to populate credentials into the login form:
            </p>
            <div className="d-flex flex-wrap gap-1.5 justify-content-start">
              {[
                { key: 'ADMIN', label: 'Admin', email: 'admin@shreejeevan.com' },
                { key: 'DOCTOR', label: 'Doctor', email: 'doctor@shreejeevan.com' },
                { key: 'RECEPTIONIST', label: 'Receptionist', email: 'reception@shreejeevan.com' },
                { key: 'NURSE', label: 'Nurse', email: 'nurse@shreejeevan.com' },
                { key: 'PHARMACIST', label: 'Pharmacist', email: 'pharmacy@shreejeevan.com' },
                { key: 'LAB_TECHNICIAN', label: 'Lab Tech', email: 'lab@shreejeevan.com' },
                { key: 'PATIENT', label: 'Patient', email: 'patient@shreejeevan.com' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => fillDemoAccount(p.key)}
                  className="btn btn-outline-secondary btn-sm py-1 px-2 text-start rounded-2 d-flex align-items-center gap-1"
                  style={{ fontSize: '0.72rem' }}
                  title={`Fill ${p.email}`}
                >
                  <KeyRound size={11} className="text-primary" />
                  <span className="fw-medium text-slate-800">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
