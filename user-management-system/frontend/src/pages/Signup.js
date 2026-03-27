import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RULES = {
  name(v) {
    if (!v.trim()) return 'Full name is required.';
    if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Name can only contain letters, spaces, hyphens, or apostrophes.';
  },
  email(v) {
    if (!v.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
  },
  password(v) {
    if (!v) return 'Password is required.';
    if (v.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter.';
    if (!/[0-9]/.test(v)) return 'Include at least one number.';
    if (!/[^A-Za-z0-9]/.test(v)) return 'Include at least one special character.';
  },
  phone(v) {
    if (!v.trim()) return 'Phone number is required.';
    if (!/^\d{10}$/.test(v.trim())) return 'Phone number must be exactly 10 digits.';
  },
  age(v) {
    if (v === '') return 'Age is required.';
    const n = Number(v);
    if (!Number.isInteger(n) || n < 13 || n > 120) return 'Age must be between 13 and 120.';
  },
};

const pwStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
};

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#ff4d4d', '#ffa94d', '#74c0fc', '#51cf66'];

function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', age: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: RULES[name]?.(value) || '' }));
    setServerError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const msg = RULES[name]?.(value);
    if (msg) setErrors((p) => ({ ...p, [name]: msg }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    Object.keys(RULES).forEach((k) => { const m = RULES[k](formData[k]); if (m) errs[k] = m; });
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setBusy(true);
      const res = await fetch('http://localhost:8080/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, age: Number(formData.age) }),
      });
      if (res.ok) {
        navigate('/login');
      } else {
        const data = await res.json().catch(() => ({}));
        setServerError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setServerError('Unable to connect to server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const strength = pwStrength(formData.password);

  const fields = [
    { name: 'name', type: 'text', placeholder: 'Full Name', autoComplete: 'name' },
    { name: 'email', type: 'email', placeholder: 'Email Address', autoComplete: 'email' },
    { name: 'phone', type: 'tel', placeholder: 'Phone Number', autoComplete: 'tel' },
    { name: 'age', type: 'number', placeholder: 'Age', autoComplete: 'off' },
  ];

  return (
    <div className="container">
      <div className="form-card">
        <div className="auth-badge">CREATE ACCOUNT</div>
        <h2>Sign Up</h2>
        <p className="auth-subtitle">Fill in the details below to get started</p>

        {serverError && <div className="auth-alert">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {fields.map(({ name, type, placeholder, autoComplete }) => (
            <div key={name}>
              <div className={`field-wrap ${errors[name] ? 'field-error' : formData[name] && !errors[name] ? 'field-ok' : ''}`}>
                <input
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  value={formData[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={busy}
                  autoComplete={autoComplete}
                  min={name === 'age' ? 13 : undefined}
                  max={name === 'age' ? 120 : undefined}
                />
                {formData[name] && !errors[name] && <span className="field-check">✓</span>}
              </div>
              {errors[name] && <p className="field-msg">{errors[name]}</p>}
            </div>
          ))}

          {/* Password field with strength meter */}
          <div>
            <div className={`field-wrap ${errors.password ? 'field-error' : formData.password && !errors.password ? 'field-ok' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={busy}
                autoComplete="new-password"
              />
              <button type="button" className="toggle-pw" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="field-msg">{errors.password}</p>}
            {formData.password && (
              <div className="pw-strength">
                <div className="pw-strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="pw-bar"
                      style={{ background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
                <span className="pw-strength-label" style={{ color: STRENGTH_COLOR[strength] }}>
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={busy}>
            {busy ? <span className="btn-spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="link-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
