import React, { useState } from 'react';
import Logo from '../components/Logo';
import AdminForm from './AdminForm';
import StudentForm from './StudentForm';
import RegisteredStudents from './RegisteredStudents';
import './RoleSelector.css';

function RoleSelector({ initialMode = 'signup' }) {
  console.log('RoleSelector render');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showRegisteredStudents, setShowRegisteredStudents] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    console.log(`Selected role: ${role}`);
  };

  const handleSignUp = () => {
    setIsSignUp(true);
    if (selectedRole === 'Admin') {
      setShowAdminForm(true);
    } else if (selectedRole === 'Student') {
      setShowStudentForm(true);
    }
  };

  const handleSignIn = () => {
    setIsSignUp(false);
    if (selectedRole === 'Admin') {
      setShowAdminForm(true);
    } else if (selectedRole === 'Student') {
      setShowStudentForm(true);
    }
  };

  const handleSignInForRole = (role) => {
    setSelectedRole(role);
    setIsSignUp(false);
    if (role === 'Admin') {
      setShowAdminForm(true);
    } else if (role === 'Student') {
      setShowStudentForm(true);
    }
  };

  if (showAdminForm) {
    return <AdminForm onBack={() => {
      setShowAdminForm(false);
      setSelectedRole(null);
    }} onSignInNow={() => handleSignInForRole('Admin')} initialTab={isSignUp ? 'signup' : 'signin'} />;
  }

  if (showStudentForm) {
    return <StudentForm onBack={() => {
      setShowStudentForm(false);
      setSelectedRole(null);
    }} onSignInNow={() => handleSignInForRole('Student')} initialTab={isSignUp ? 'signup' : 'signin'} />;
  }

  if (showRegisteredStudents) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          className="btn-back-to-home"
          onClick={() => setShowRegisteredStudents(false)}
          aria-label="Back to role selection"
        >
          ← Back to Home
        </button>
        <RegisteredStudents />
      </div>
    );
  }

  return (
    <div className="role-selector-container">
      <div className="role-selector-background"></div>
      
      <div className="role-selector-modal">
        <div className="logo-wrapper">
          <Logo size="large" />
        </div>
        
        <h1 className="role-selector-title">Select Your Role</h1>
        
        <div className="role-buttons-container">
          <button 
            className={`role-btn admin-btn ${selectedRole === 'Admin' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('Admin')}
          >
            Admin
          </button>
          
          <button 
            className={`role-btn student-btn ${selectedRole === 'Student' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('Student')}
          >
            Student
          </button>

          {selectedRole && (
            <div className="auth-buttons-container">
              <button 
                className="auth-btn sign-up-btn"
                onClick={handleSignUp}
              >
                Sign Up
              </button>
              
              <button 
                className="auth-btn sign-in-btn"
                onClick={handleSignIn}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoleSelector;
