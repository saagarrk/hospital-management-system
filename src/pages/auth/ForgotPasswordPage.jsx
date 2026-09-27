import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, HeartPulse, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccessInfo(res);
      Swal.fire({
        icon: 'success',
        title: 'Dispatch Initiated',
        text: res.message || 'If that email address exists in our database, a password reset link has been dispatched.',
        confirmButtonColor: '#2563EB',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch password recovery request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column flex-lg-row bg-slate-50">
      {/* LEFT SIDE: Brand */}
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
            Pune, Maharashtra · Identity Protection
          </span>
        </div>

        <div className="my-5 position-relative z-1">
          <h1 className="display-6 fw-extrabold text-white mb-3 text-balance leading-tight">
            Account Recovery
          </h1>
          <p className="text-slate-300 fs-6 mb-4">
            Enter your verified healthcare account email address to receive a secure, one-time time-limited password
            reset token protected against user enumeration.
          </p>
        </div>

        <div className="position-relative z-1 pt-3 border-top border-white/15 text-slate-300 small">
          Remembered your password?{' '}
          <Link to="/login" className="text-white fw-bold text-decoration-underline ms-1">
            Back to Sign In
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE: Reset Form Card */}
      <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-3 p-md-5 bg-white">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-circle bg-primary-subtle text-primary mb-3 shadow-sm">
              <KeyRound size={28} />
            </div>
            <h3 className="fw-bold text-slate-900 mb-1">Forgot Password</h3>
            <p className="text-muted small mb-0">We will send a password reset token to your verified email</p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo ? (
            <div className="p-4 rounded-3 bg-emerald-50 border border-emerald-200 text-emerald-950 mb-3 text-center">
              <CheckCircle2 size={36} className="text-success mx-auto mb-2" />
              <h6 className="fw-bold mb-2">Request Processed</h6>
              <p className="small mb-3" style={{ fontSize: '0.85rem' }}>
                {successInfo.message}
              </p>
              {successInfo.debugToken && (
                <div className="p-2 border rounded bg-white font-mono small text-muted text-break mb-3">
                  <span className="fw-bold d-block text-slate-700">Demo Reset Token:</span>
                  <code>{successInfo.debugToken}</code>
                </div>
              )}
              <Link
                to={`/reset-password${successInfo.debugToken ? `?token=${encodeURIComponent(successInfo.debugToken)}` : ''}`}
                className="btn btn-primary-custom btn-sm w-100 py-2 rounded-2"
              >
                Proceed to Reset Password &rarr;
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label className="form-label fw-semibold text-slate-700 small">Registered Email Address *</label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-slate-200 text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="form-control border-slate-200"
                    placeholder="e.g. physician@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                    <span>Generating Security Token...</span>
                  </>
                ) : (
                  <>
                    <span>Dispatch Reset Token</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-muted text-decoration-none small d-inline-flex align-items-center gap-1">
                  <ArrowLeft size={14} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
