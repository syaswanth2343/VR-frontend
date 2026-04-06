import React, { useState } from 'react';
import ForgotPassword from './ForgotPassword';
import CaptchaVerification from '../components/CaptchaVerification';
import AdminDashboard from './AdminDashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { auth, users, loginHistory } from '../api/databaseAPI';
import './AdminForm.css';

function AdminForm({ onBack, onSignInNow, initialTab = 'signup' }) {
  const [isSignUp, setIsSignUp] = useState(initialTab === 'signup');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminId, setAdminId] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phoneNumber: '',
    email: '',
    linkedinProfile: '',
    state: '',
    educationContent: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentLoginId, setCurrentLoginId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Sign-up / sign-in: no field-format verification (CAPTCHA still required where shown).
  const validateSignUpCaptchaOnly = () => {
    const newErrors = {};
    if (!captchaVerified) {
      newErrors.captcha = 'Please verify the captcha';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (validateSignUpCaptchaOnly()) {
        console.log('Sign up submitted:', formData);
        // attempt to create admin user via backend (bootstrap if none exist)
        try {
          const result = await users.create(
            formData.username.trim(),
            formData.email.trim(),
            formData.password,
            'admin'
          );
          console.log('user create result', result);
          if (result && result.ok) {
            // save adminId for display
            setAdminId(result.userCode || '');
            setSubmitted(true);
          }
        } catch (err) {
          console.error('admin signup API error', err);
          alert('Failed to create admin user: ' + (err.message || err));
        }
      }
    } else {
      const signInErrors = {};
      if (!captchaVerified) {
        signInErrors.captcha = 'Please complete the verification code';
      }
      if (Object.keys(signInErrors).length === 0) {
        try {
          const resp = await auth.login(formData.username.trim(), formData.password);
          if (resp && resp.ok && resp.token) {
            localStorage.setItem('authToken', resp.token);
            const emailLocal = (formData.email && formData.email.includes('@'))
              ? formData.email.split('@')[0]
              : '';
            const nameToShow = resp.user?.username || formData.username.trim() || emailLocal || 'Admin';
            setAdminName(nameToShow);
            setAdminId(resp.user?.userCode || '');
            setIsLoggedIn(true);
          } else {
            setErrors(prev => ({ ...prev, username: resp?.message || 'Login failed' }));
          }
        } catch (loginErr) {
          console.error('login error', loginErr);
          setErrors(prev => ({ ...prev, username: loginErr.message || 'Login failed' }));
        }
      } else {
        setErrors(signInErrors);
      }
    }
  };

  if (isLoggedIn) {
    console.log('AdminForm: rendering AdminDashboard (isLoggedIn=true)');
    return (
      <ErrorBoundary>
        <AdminDashboard onLogout={() => {
          setIsLoggedIn(false);
          setAdminName('');
          setAdminId('');
          setCaptchaVerified(false);
          setFormData({ ...formData, password: '', email: '' });
          localStorage.removeItem('authToken');
          // record logout if we have an id
          if (currentLoginId) {
            loginHistory.recordLogout(currentLoginId).catch(e=>console.error('logout history failed', e));
            setCurrentLoginId(null);
          }
        }} adminName={adminName} adminId={adminId} />
      </ErrorBoundary>
    );
  }

  if (submitted) {
    return (
      <div className="admin-form-container">
        <div className="success-message">
          <h2>Welcome, {formData.username || formData.name}!</h2>
          <p>Your registration was successful.</p>
          {adminId && (
            <p>Your unique Admin ID: <strong>{adminId}</strong></p>
          )}
          <p>You can sign in with your account credentials.</p>
        <div className="button-group">
          <button
            className="btn-primary"
            onClick={() => {
              setSubmitted(false);
              setIsSignUp(false);
              setCaptchaVerified(false);
              if (onSignInNow) onSignInNow();
            }}
          >
            Sign In Now
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Back to Role Selection
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="admin-form-container">
      <div className="form-wrapper">
        <button className="btn-back" onClick={onBack}>← Back</button>

        <div className="form-tabs">
          <button
            className={`tab ${isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
          <button
            className={`tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <h1 className="form-title">Admin Registration</h1>

          {/* Common fields */}
          <div className="form-group">
            <label htmlFor="username">{isSignUp ? "Username *" : "Username, Email, or ID *"}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={isSignUp ? "Choose a username" : "Enter your username, email, or ID"}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          )}

          {isSignUp ? (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your 10-digit phone number"
                  className={errors.phoneNumber ? 'error' : ''}
                />
                {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="linkedinProfile">LinkedIn Profile *</label>
                <input
                  type="url"
                  id="linkedinProfile"
                  name="linkedinProfile"
                  value={formData.linkedinProfile}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={errors.linkedinProfile ? 'error' : ''}
                />
                {errors.linkedinProfile && <span className="error-text">{errors.linkedinProfile}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={errors.state ? 'error' : ''}
                >
                  <option value="">Select your state</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
                {errors.state && <span className="error-text">{errors.state}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="educationContent">Education Content *</label>
                <textarea
                  id="educationContent"
                  name="educationContent"
                  value={formData.educationContent}
                  onChange={handleInputChange}
                  placeholder="Describe your educational background, qualifications, and certifications"
                  rows="4"
                  className={errors.educationContent ? 'error' : ''}
                ></textarea>
                {errors.educationContent && <span className="error-text">{errors.educationContent}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <div className="security-block security-only-widget">
                <div className="security-widget full-width">
                  <CaptchaVerification onVerify={setCaptchaVerified} />
                  {errors.captcha && <span className="error-text">{errors.captcha}</span>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="security-block">
                <div className="security-info">
                  <p className="security-title">Security verification</p>
                  <p className="security-desc">Verify to continue signing in.</p>
                </div>
                <div className="security-widget">
                  <CaptchaVerification onVerify={setCaptchaVerified} />
                  {errors.captcha && <span className="error-text">{errors.captcha}</span>}
                </div>
              </div>

              <button type="button" className="btn-forgot-password" onClick={() => setShowForgotPassword(true)}>
                Forgot Password?
              </button>
            </>
          )}

          <button type="submit" className="btn-primary">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminForm;
