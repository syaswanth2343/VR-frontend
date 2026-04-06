import React, { useState } from 'react';
import ForgotPassword from './ForgotPassword';
import CaptchaVerification from '../components/CaptchaVerification';
import StudentDashboard from './StudentDashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { auth, loginHistory, users } from '../api/databaseAPI';
import './StudentForm.css';

function StudentForm({ onBack, onSignInNow, initialTab = 'signup' }) {
  const [isSignUp, setIsSignUp] = useState(initialTab === 'signup');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentUsername, setStudentUsername] = useState('');
  const [studentId, setStudentId] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phoneNumber: '',
    email: '',
    linkedinProfile: '',
    state: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      console.log('Sign up submitted:', formData);
      try {
        const result = await users.create(
          formData.username.trim(),
          formData.email.trim(),
          formData.password,
          'student'
        );
        if (result && result.ok) {
          if (result.userCode) {
            setStudentId(result.userCode);
          }
          setSubmitted(true);
          const studentsKey = 'registered_students';
          const existingStudents = JSON.parse(localStorage.getItem(studentsKey)) || [];
          const newStudent = {
            id: Date.now(),
            username: formData.username,
            name: formData.name,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            linkedinProfile: formData.linkedinProfile,
            state: formData.state,
            registeredDate: new Date().toLocaleDateString(),
            registeredTime: new Date().toLocaleTimeString()
          };
          existingStudents.push(newStudent);
          localStorage.setItem(studentsKey, JSON.stringify(existingStudents));
        }
      } catch (err) {
        console.error('student signup API error', err);
        alert('Failed to create student account: ' + (err.message || err));
      }
    } else {
      const signInErrors = {};
      if (!captchaVerified) {
        signInErrors.captcha = 'Please verify the CAPTCHA';
      }

      if (Object.keys(signInErrors).length === 0) {
        // call backend auth
        try {
          const resp = await auth.login(formData.username.trim(), formData.password);
          if (resp && resp.ok && resp.token) {
            localStorage.setItem('authToken', resp.token);
            const displayName = resp.user?.username || formData.username.trim() || formData.email;
            setStudentUsername(displayName);
            setStudentId(resp.user?.userCode || '');
            setIsLoggedIn(true);
            try {
              const hist = await loginHistory.recordLogin(resp.user.id, window.location.hostname, navigator.userAgent, 'web');
              if (hist && hist.loginId) setCurrentLoginId(hist.loginId);
            } catch (hErr) {
              console.error('login history error', hErr);
            }
          } else {
            setErrors(prev => ({ ...prev, username: resp?.message || 'Login failed' }));
          }
        } catch (loginErr) {
          console.error('student login error', loginErr);
          setErrors(prev => ({ ...prev, username: loginErr.message || 'Login failed' }));
        }
      } else {
        setErrors(signInErrors);
      }
    }
  };

  if (isLoggedIn) {
    console.log('StudentForm: rendering StudentDashboard');
    return (
      <ErrorBoundary>
        <StudentDashboard onLogout={() => {
          setIsLoggedIn(false);
          setStudentUsername('');
          setStudentId('');
          setCaptchaVerified(false);
          setFormData({ ...formData, password: '', email: '' });
          localStorage.removeItem('authToken');
          if (currentLoginId) {
            loginHistory.recordLogout(currentLoginId).catch(e=>console.error('logout history failed', e));
            setCurrentLoginId(null);
          }
        }} studentUsername={studentUsername} studentId={studentId} />
      </ErrorBoundary>
    );
  }

  if (submitted) {
    return (
      <div className="student-form-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Welcome, {formData.username || formData.name}!</h2>
          <p>Your registration was successful.</p>
          {studentId ? (
            <p>Your Student ID: <strong>{studentId}</strong></p>
          ) : (
            <p>You will receive a Student ID (TR###) when you first sign in.</p>
          )}
          <p className="email-sent">You can sign in with your account credentials.</p>
          
          <div className="registration-details">
            <h3>Your Registration Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Username:</label>
                <span>{formData.username}</span>
              </div>
              <div className="detail-item">
                <label>Name:</label>
                <span>{formData.name}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{formData.email}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{formData.phoneNumber}</span>
              </div>
              <div className="detail-item">
                <label>State:</label>
                <span>{formData.state}</span>
              </div>
              <div className="detail-item">
                <label>LinkedIn Profile:</label>
                <span className="linkedin-link">
                  <a href={formData.linkedinProfile} target="_blank" rel="noopener noreferrer">
                    View Profile →
                  </a>
                </span>
              </div>
            </div>
          </div>

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
    <div className="student-form-container">
      <div className="form-wrapper">
        <div className="form-header">
          <button className="btn-back" onClick={onBack} title="Back to role selection">← Back</button>
          <h1 className="form-title">Student Portal</h1>
        </div>
        
        <div className="form-tabs">
          <button
            className={`tab ${isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(true)}
          >
            <span className="tab-icon">✍</span>
            <span>Create Account</span>
          </button>
          <button
            className={`tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(false)}
          >
            <span className="tab-icon">🔓</span>
            <span>Sign In</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-intro">
            {isSignUp ? (
              <p>Join our student community and get started in minutes</p>
            ) : (
              <p>Welcome back! Sign in to your account</p>
            )}
          </div>

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

              <div className="security-block security-only-widget">
                <div className="security-widget full-width">
                  <CaptchaVerification onVerify={setCaptchaVerified} />
                  {errors.captcha && <span className="error-text">{errors.captcha}</span>}
                </div>
              </div>

              <button type="button" className="btn-forgot-password" onClick={() => setShowForgotPassword(true)}>
                Forgot Password?
              </button>
            </>
          )}

          <button type="submit" className="btn-submit">
            <span className="btn-icon">{isSignUp ? '✓' : '→'}</span>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="form-footer">
            {isSignUp ? (
              <p>Already have an account? <button type="button" className="link-btn" onClick={() => setIsSignUp(false)}>Sign In here</button></p>
            ) : (
              <p>Don't have an account? <button type="button" className="link-btn" onClick={() => setIsSignUp(true)}>Create one</button></p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentForm;
