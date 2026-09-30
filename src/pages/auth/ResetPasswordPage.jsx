import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, HeartPulse, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';

export const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [resetToken, setResetToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setResetToken(t);
    }
  }, [searchParams]);

  // Password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Too short', color: 'bg-secondary' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-danger' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-warning' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-info' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-success' };
      default:
        return { score: 0, label: 'Too short', color: 'bg-secondary' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!resetToken.trim()) {
      setErrorMessage('Please provide your secure password reset token');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('New password must contain at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const msg = await resetPassword(resetToken, newPassword);
      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: msg || 'Your password has been successfully reset. Please log in with your new credentials.',
        confirmButtonColor: '#0B5C75',
      }).then(() => {
        navigate('/login');
      });
    } catch (err) {
      setErrorMessage(err.message || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column flex-lg-row bg-slate-50">
      {/* LEFT SIDE */}
      <div className="col-12 col-lg-5 auth-split-bg text-white p-4 p-md-5 d-flex flex-column justify-content-between position-relative">
        <div className="position-relative z-1">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-white p-2.5 rounded-3 text-primary d-flex align-items-center justify-content-center shadow">
              <HeartPulse size={26} strokeWidth={2.5} className="text-primary" />
            </div>
            <div>
              <div className="fs-4 fw-bold tracking-tight text-white leading-tight">Shree Jeevan</div>
              <div className="fs-6 fw-medium text-cyan-200">Multispeciality Hospital</div>
            </div>
          </div>
          <span className="badge bg-teal-800 text-teal-100 border border-teal-600 px-3 py-1 rounded-pill small font-mono">
            Pune, Maharashtra · Secure Credential Update
          </span>
        </div>

        <div className="my-5 position-relative z-1">
          <h1 className="display-6 fw-extrabold text-white mb-3 text-balance leading-tight">
            Create New Password
          </h1>
          <p className="text-slate-300 fs-6 mb-4">
            Enter the one-time security token generated during the recovery request and create a strong, BCrypt-salted
            password for your hospital management account.
          </p>
        </div>

        <div className="position-relative z-1 pt-3 border-top border-white/15 text-slate-300 small">
          Cancel and return to{' '}
          <Link to="/login" className="text-white fw-bold text-decoration-underline ms-1">
            Sign In
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-3 p-md-5 bg-white">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-circle bg-primary-subtle text-primary mb-3 shadow-sm">
              <KeyRound size={28} />
            </div>
            <h3 className="fw-bold text-slate-900 mb-1">Set New Password</h3>
            <p className="text-muted small mb-0">Enter your verification token and secure credentials</p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Reset Token */}
            <div className="mb-3">
              <label className="form-label fw-semibold text-slate-700 small">Reset Token *</label>
              <input
                type="text"
                className="form-control border-slate-200 font-mono small"
                placeholder="Paste token received in email"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>

            {/* New Password */}
            <div className="mb-3">
              <label className="form-label fw-semibold text-slate-700 small">New Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-slate-200"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {newPassword && (
                <div className="mt-1">
                  <div className="d-flex align-items-center justify-content-between small text-muted mb-1" style={{ fontSize: '0.7rem' }}>
                    <span>Strength: {strength.label}</span>
                    <span>{strength.score}%</span>
                  </div>
                  <div className="progress" style={{ height: '4px' }}>
                    <div
                      className={`progress-bar ${strength.color}`}
                      role="progressbar"
                      style={{ width: `${strength.score}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-slate-700 small">Confirm New Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control border-slate-200"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary-custom w-100 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Updating Security Hash...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center text-muted small">
              <Link to="/login" className="text-primary fw-semibold text-decoration-none">
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
