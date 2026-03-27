import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const validate = ({ email, password }) => {
  const errs = {};
  if (!email.trim()) errs.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
  if (!password) errs.password = 'Password is required.';
  else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
  return errs;
};

function Login({ setAuth }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    // clear field error on change
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(formData);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setBusy(true);
      const res = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(user));
        setAuth(true);
        navigate('/profile');
      } else {
        setServerError('Invalid email or password. Please try again.');
      }
    } catch {
      setServerError('Unable to connect to server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="form-card">
        <div className="auth-badge">WELCOME BACK</div>
        <h2>Sign In</h2>
        <p className="auth-subtitle">Enter your credentials to continue</p>

        {serverError && <div className="auth-alert">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`field-wrap ${errors.email ? 'field-error' : formData.email ? 'field-ok' : ''}`}>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              disabled={busy}
              autoComplete="email"
            />
            {formData.email && !errors.email && <span className="field-check">✓</span>}
          </div>
          {errors.email && <p className="field-msg">{errors.email}</p>}

          <div className={`field-wrap ${errors.password ? 'field-error' : formData.password ? 'field-ok' : ''}`}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={busy}
              autoComplete="current-password"
            />
            <button type="button" className="toggle-pw" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="field-msg">{errors.password}</p>}

          <button type="submit" className="btn-submit" disabled={busy}>
            {busy ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="link-text">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
