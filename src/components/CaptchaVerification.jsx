import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL as API_BASE } from '../config/apiBase';
import './CaptchaVerification.css';

function CaptchaVerification({ onVerify }) {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState(null);
  const [honeypot, setHoneypot] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const canvasRef = useRef(null);
  const statusRef = useRef(null);

  const randomCode = (length = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < length; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  };

  const drawCaptcha = useCallback((code, seedHue = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 240;
    const h = 70;
    canvas.width = w * 2; // HiDPI
    canvas.height = h * 2;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(2, 2);

    // detect theme (body class or prefers-color-scheme)

    // background FIRST - respect CSS variable for surface
    const computed = (typeof window !== 'undefined') ? getComputedStyle(document.documentElement).getPropertyValue('--surface') : null;
    const canvasBg = (computed && computed.trim()) ? computed.trim() : '#ffffff';
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, w, h);

    // pick a color palette for this captcha (seeded if seedHue provided)
    const palette = [];
    const baseHue = (typeof seedHue === 'number') ? Math.floor(seedHue) : Math.floor(Math.random() * 360);
    for (let p = 0; p < 5; p++) {
      const h = (baseHue + p * (30 + Math.floor(Math.random() * 40))) % 360;
      const s = 55 + Math.floor(Math.random() * 20);
      const l = 30 + Math.floor(Math.random() * 30);
      palette.push(`hsl(${h} ${s}% ${l}%)`);
    }

    // background colored speckles
    for (let i = 0; i < 28; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillStyle = col.replace('%)', ` / ${0.06 + Math.random() * 0.12})`);
      ctx.beginPath();
      const r = Math.random() * 3;
      ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw characters
    const gap = w / (code.length + 1);
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      const x = gap * (i + 1) + (Math.random() * 6 - 3);
      const y = h / 2 + (Math.random() * 10 - 5);
      const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
      const fs = 30 + Math.floor(Math.random() * 14);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // colorful gradient fill for character
      const base = palette[i % palette.length];
      const g = ctx.createLinearGradient(-fs / 2, -fs / 2, fs / 2, fs / 2);
      g.addColorStop(0, base);
      g.addColorStop(1, '#111');
      ctx.fillStyle = g;
      ctx.font = `${fs}px monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, -fs / 2, 0);

      // subtle stroke
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.strokeText(ch, -fs / 2, 0);
      ctx.restore();
    }

    // overlay multicolored lines
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      const col = palette[Math.floor(Math.random() * palette.length)];
      ctx.strokeStyle = col.replace('%)', ` / ${0.12 + Math.random() * 0.24})`);
      ctx.lineWidth = 0.8 + Math.random() * 2.2;
      ctx.stroke();
    }

    // small colored arcs / blobs
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 8;
      const col = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillStyle = col.replace('%)', ` / ${0.06 + Math.random() * 0.10})`);
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const generateCaptcha = useCallback(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/captcha-challenge`);
        const ch = await res.json();
        setChallenge(ch);

        // derive numeric seed from nonce for deterministic palette
        let seed = 0;
        for (let i = 0; i < ch.nonce.length; i++) seed = (seed * 31 + ch.nonce.charCodeAt(i)) % 360;

        const code = randomCode(6);
        setCaptchaCode(code);
        setUserInput('');
        setError('');
        setIsVerified(false);
        setGeneratedAt(Date.now());
        drawCaptcha(code, seed);
      } catch (err) {
        console.error('generateCaptcha error:', err);
        // fallback to client-only when server not available
        const code = randomCode(6);
        setCaptchaCode(code);
        setUserInput('');
        setError('');
        setIsVerified(false);
        setGeneratedAt(Date.now());
        drawCaptcha(code);
      }
    })();
  }, [drawCaptcha]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const speakCode = () => {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(captchaCode.split('').join(' '));
    utter.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const clientValidate = () => {
    if (userInput.trim() === '') {
      setError('Please enter the verification code');
      return { ok: false };
    }
    if (userInput.toUpperCase() !== captchaCode) {
      setError('Verification code is incorrect.');
      setUserInput('');
      return { ok: false };
    }
    return { ok: true };
  };

  const handleVerify = async () => {
    setError('');
    const valid = clientValidate();
    if (!valid.ok) {
      if (onVerify) onVerify(false);
      return;
    }

    // Optional server-side verification (keeps the previous behavior)
    try {
      const elapsed = generatedAt ? Math.floor((Date.now() - generatedAt) / 1000) : 0;
      const body = { elapsed, honeypot };
      if (challenge && challenge.nonce && challenge.ts && challenge.sig) {
        body.nonce = challenge.nonce;
        body.ts = challenge.ts;
        body.sig = challenge.sig;
      }

      const res = await fetch(`${API_BASE}/verify-captcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).catch(() => null);

      if (res) {
        const data = await res.json().catch(() => ({}));
          if (res.ok && data.success) {
          setIsVerified(true);
          if (onVerify) onVerify(true);
          if (statusRef.current) try { statusRef.current.focus({ preventScroll: true }); } catch (e) { statusRef.current.focus(); }
          return;
        }
      }

      // fallback: if server not available, accept client-side match
      setIsVerified(true);
      if (onVerify) onVerify(true);
      if (statusRef.current) try { statusRef.current.focus({ preventScroll: true }); } catch (e) { statusRef.current.focus(); }
    } catch (err) {
      console.error('handleVerify error:', err);
      setError('Verification service unavailable. Please try again later.');
      if (onVerify) onVerify(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    generateCaptcha();
    setTimeout(() => setRefreshing(false), 420);
  };


  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setUserInput(val);
    if (error) setError('');
    if (isVerified) setIsVerified(false);
  };

  return (
    <div className="captcha-container" role="group" aria-labelledby="captcha-title">
      <div className="captcha-header">
        <div className="captcha-icon">🔐</div>
        <div>
          <h3 id="captcha-title">Security Verification</h3>
          <p className="captcha-subtitle">Prove you're human by entering the code below</p>
        </div>
      </div>

      <div className="captcha-card">
        <div className="captcha-visual-wrapper">
          <div className="captcha-visual" aria-hidden="false" onClick={() => {
              const inp = document.getElementById('captcha-input');
              if (inp) inp.focus();
            }}>
            <canvas ref={canvasRef} className={`captcha-canvas ${refreshing ? 'refreshing' : ''}`} role="img" aria-label="Verification image" />
          </div>
          <div className="captcha-actions">
            <button type="button" className="btn-action btn-refresh" onClick={(e) => { e.stopPropagation(); handleRefresh(); }} aria-label="Refresh code" title="Get a new code">⟳</button>
            <button type="button" className="btn-action btn-audio" onClick={(e) => { e.stopPropagation(); speakCode(); }} aria-label="Listen to code" title="Listen to code">🔊</button>
          </div>
          <div className="captcha-help-text">
            <p>Can't read the code? <button type="button" className="help-link" onClick={speakCode}>Listen</button> or <button type="button" className="help-link" onClick={handleRefresh}>refresh</button></p>
          </div>
        </div>

        <div className="captcha-form" aria-live="polite">
          <div className="captcha-input-group">
            <label htmlFor="captcha-input" className="captcha-input-label">Enter Code</label>
            <input
              id="captcha-input"
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onFocus={() => { if (isVerified) setIsVerified(false); }}
              placeholder="Enter 6 characters"
              maxLength="6"
              className={`captcha-input ${error ? 'error' : ''} ${isVerified ? 'verified' : ''}`}
              aria-invalid={!!error}
              aria-describedby={error ? 'captcha-error' : undefined}
            />
          </div>

          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hp-field"
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
          />

          {error && (
            <div id="captcha-error" className="error-message" role="alert">
              <span className="error-icon">⚠</span> {error}
            </div>
          )}

          {isVerified && (
            <div className="success-message" role="status" tabIndex="0" ref={statusRef}>
              <span className="success-icon">✓</span> Verification successful!
            </div>
          )}

          <button type="button" className={`btn-verify ${isVerified ? 'verified' : ''}`} onClick={handleVerify} disabled={isVerified}>
            <span className="verify-icon">{isVerified ? '✓' : '→'}</span>
            {isVerified ? 'Verified' : 'Verify Code'}
          </button>

          <div className="captcha-hint">
            <p>Characters are case-insensitive. If you're having trouble, use the audio option above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptchaVerification;
