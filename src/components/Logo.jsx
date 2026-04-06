import React from 'react';
import './Logo.css';
import newLogo from '../assets/newlogo.png';
// use a bundled svg fallback in case the PNG cannot be loaded
import bundledLogo from '../assets/klu-logo.svg';

function Logo({ size = 'medium' }) {
  const publicLogo = newLogo;
  const bundled = bundledLogo;

  const handleError = (e) => {
    const img = e && e.target;
    if (!img) return;
    // fall back to bundled svg if the public image isn't available
    if (!img.src.endsWith(bundled)) img.src = bundled;
  };

  return (
    <div className={`logo-container logo-${size}`}>
      <span className="logo-mark" aria-hidden>
        <img
          src={publicLogo}
          alt="VR Troops Logo"
          className="logo-img"
          onError={handleError}
        />
      </span>
    </div>
  );
}

export default Logo;
