import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import './Header.css';

function Header() {
  console.log('Header render');
  // store full theme name instead of a boolean so we can manage both classes
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // fallback to system preference
      if (window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      // always ensure exactly one of the theme classes is present
      root.classList.remove('theme-dark', 'theme-light');
      if (theme === 'dark') {
        root.classList.add('theme-dark');
      } else {
        root.classList.add('theme-light');
      }
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('theme toggle error', e);
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  // helper for rendering and aria attributes
  const isDark = theme === 'dark';

  return (
    <header className="header">
      <div className="header-container">
        <Logo size="large" />
        <nav className="header-nav">
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>

        <div className="header-actions-icons">
          <button
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-pressed={isDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
