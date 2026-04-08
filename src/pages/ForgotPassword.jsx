import React, { useState } from 'react';
import { API_BASE_URL as API_BASE } from '../config/apiBase';
import './ForgotPassword.css';

function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1); // 1: email verification, 2: OTP verification, 3: reset password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  

  const validateEmail = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      // Call your backend API to send OTP
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        console.log('OTP sent to:', email);
        alert(`OTP sent to ${email}. Check your inbox.`);
        setStep(2);
      } else {
        setLoading(false);
        setErrors({ email: data.message || 'Failed to send OTP' });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error sending OTP:', error);
      
      // Fallback: Demo mode when backend is not running
      if (error.message.includes('Failed to fetch') || error instanceof TypeError) {
        alert('⚠️ Backend server is not running!\n\nTo fix:\n1. Create vrtroops-backend folder\n2. Run: npm install express cors nodemailer dotenv\n3. Create .env with EMAIL_USER and EMAIL_PASSWORD\n4. Run: node server.js\n\nFor now, using DEMO MODE - OTP: 123456');
        setStep(2);
        setErrors({});
      } else {
        setErrors({ email: 'Network error. Please try again.' });
      }
    }
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^[0-9]{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setLoading(true);
    try {
      // Call your backend API to verify OTP
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        console.log('OTP verified');
        setStep(3);
      } else {
        setLoading(false);
        setErrors({ otp: data.message || 'Invalid OTP' });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error verifying OTP:', error);
      
      // Fallback: Demo mode - accept OTP 123456
      if (error.message.includes('Failed to fetch') || error instanceof TypeError) {
        if (otp === '123456') {
          setStep(3);
          setErrors({});
        } else {
          setErrors({ otp: 'Invalid OTP. Use demo OTP: 123456' });
        }
      } else {
        setErrors({ otp: 'Network error. Please try again.' });
      }
    }
  };
  const validatePassword = () => {
    const newErrors = {};
    if (!newPassword.trim()) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      // Call your backend API to reset password
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        console.log('Password reset successful');
        alert('Password reset successful! Please sign in with your new password.');
        onBack();
      } else {
        setLoading(false);
        setErrors({ newPassword: data.message || 'Failed to reset password' });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error resetting password:', error);
      
      // Fallback: Demo mode - accept password reset
      if (error.message.includes('Failed to fetch') || error instanceof TypeError) {
        alert('Password reset successful! (Demo Mode)\nPlease sign in with your new password.');
        onBack();
      } else {
        setErrors({ newPassword: 'Network error. Please try again.' });
      }
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="form-wrapper">
        <button className="btn-back" onClick={onBack}>← Back</button>

        <div className="forgot-password-form">
          <h1 className="form-title">Reset Password</h1>

          {/* Step 1: Email Verification */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <p className="form-description">Enter your email to receive an OTP</p>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="Enter your registered email"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <p className="form-description">
                OTP has been sent to <strong>{email}</strong>
              </p>
              <p className="form-description-small">Enter the 6-digit OTP</p>

              <div className="form-group">
                <label htmlFor="otp">One-Time Password *</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  className={errors.otp ? 'error' : ''}
                />
                {errors.otp && <span className="error-text">{errors.otp}</span>}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Verifying OTP...' : 'Verify OTP'}
              </button>

              <button type="button" className="btn-resend" onClick={handleSendOtp} disabled={loading}>
                Resend OTP
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <p className="form-description">Create a new password for your account</p>

              <div className="form-group">
                <label htmlFor="newPassword">New Password *</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
                  }}
                  placeholder="Enter new password"
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
