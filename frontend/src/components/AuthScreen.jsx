import { useMemo, useState } from "react";
import { styles } from "../styles";

const SIGNUP_RULES = {
    name(value) {
        if (!value.trim()) return "Full name is required.";
        if (value.trim().length < 2) return "Name must be at least 2 characters.";
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Name can only contain letters, spaces, hyphens, or apostrophes.";
    },
    email(value) {
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
    },
    password(value) {
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(value)) return "Include at least one uppercase letter.";
        if (!/[0-9]/.test(value)) return "Include at least one number.";
        if (!/[^A-Za-z0-9]/.test(value)) return "Include at least one special character.";
    },
    phone(value) {
        if (!value.trim()) return "Phone number is required.";
        if (!/^\d{10}$/.test(value.trim())) return "Phone number must be exactly 10 digits.";
    },
    age(value) {
        if (value === "") return "Age is required.";
        const number = Number(value);
        if (!Number.isInteger(number) || number < 13 || number > 120) return "Age must be between 13 and 120.";
    },
};

const LOGIN_RULES = {
    email: SIGNUP_RULES.email,
    password(value) {
        if (!value) return "Password is required.";
        if (value.length < 6) return "Password must be at least 6 characters.";
    },
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#ff8a8a", "#ffb86b", "#88dcff", "#8ce3a4"];

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

export default function AuthScreen({ mode, setMode, userApiBase, onAuthSuccess }) {
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", phone: "", age: "" });
    const [loginErrors, setLoginErrors] = useState({});
    const [signupErrors, setSignupErrors] = useState({});
    const [authError, setAuthError] = useState("");
    const [busy, setBusy] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(signupForm.password), [signupForm.password]);

    const handleLoginChange = (event) => {
        const { name, value } = event.target;
        setLoginForm((previous) => ({ ...previous, [name]: value }));
        if (loginErrors[name]) setLoginErrors((previous) => ({ ...previous, [name]: "" }));
        setAuthError("");
    };

    const handleSignupChange = (event) => {
        const { name, value } = event.target;
        setSignupForm((previous) => ({ ...previous, [name]: value }));
        if (signupErrors[name]) {
            setSignupErrors((previous) => ({ ...previous, [name]: SIGNUP_RULES[name]?.(value) || "" }));
        }
        setAuthError("");
    };

    const handleSignupBlur = (event) => {
        const { name, value } = event.target;
        const message = SIGNUP_RULES[name]?.(value);
        if (message) setSignupErrors((previous) => ({ ...previous, [name]: message }));
    };

    const submitLogin = async (event) => {
        event.preventDefault();

        const nextErrors = {};
        Object.entries(LOGIN_RULES).forEach(([field, validate]) => {
            const message = validate(loginForm[field]);
            if (message) nextErrors[field] = message;
        });

        if (Object.keys(nextErrors).length > 0) {
            setLoginErrors(nextErrors);
            return;
        }

        try {
            setBusy(true);
            setAuthError("");

            const response = await fetch(`${userApiBase}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginForm),
            });

            if (!response.ok) {
                throw new Error("Invalid email or password. Please try again.");
            }

            const user = await response.json();
            localStorage.setItem("currentUser", JSON.stringify(user));
            onAuthSuccess(user);
        } catch (error) {
            setAuthError(error.message || "We couldn't sign you in right now. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const submitSignup = async (event) => {
        event.preventDefault();

        const nextErrors = {};
        Object.entries(SIGNUP_RULES).forEach(([field, validate]) => {
            const message = validate(signupForm[field]);
            if (message) nextErrors[field] = message;
        });

        if (Object.keys(nextErrors).length > 0) {
            setSignupErrors(nextErrors);
            return;
        }

        try {
            setBusy(true);
            setAuthError("");

            const response = await fetch(`${userApiBase}/api/users/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...signupForm, age: Number(signupForm.age) }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Registration failed. Please try again.");
            }

            setMode("login");
            setLoginForm((previous) => ({ ...previous, email: signupForm.email }));
            setSignupForm({ name: "", email: "", password: "", phone: "", age: "" });
            setSignupErrors({});
        } catch (error) {
            setAuthError(error.message || "We couldn't create your account right now. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="auth-layout">
            <div className="auth-panel auth-panel-copy">
                <p className="eyebrow">Welcome</p>
                <h2 className="hero-title">Sign in when you are ready to begin.</h2>
                <p className="hero-copy">
                    Choose a topic, move through a few guided questions, and continue with supportive chat whenever you need it.
                </p>

                <div className="hero-stats">
                    <div className="hero-stat-card">
                        <span className="hero-stat-label">Inside The App</span>
                        <strong>Guided topics, practical summaries, and follow-up chat</strong>
                    </div>
                    <div className="hero-stat-card">
                        <span className="hero-stat-label">Your Space</span>
                        <strong>Your account keeps your support flow in one place</strong>
                    </div>
                </div>
            </div>

            <div style={styles.card} className="auth-panel">
                <div style={styles.cardTop} className="panel-card-top">
                    <div>
                        <div style={styles.badge}>{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</div>
                        <h2 style={styles.cardTitle}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                        <p className="section-helper">
                            {mode === "login"
                                ? "Use your account details to continue."
                                : "Create an account first, then sign in to continue."}
                        </p>
                    </div>
                </div>

                {authError && <div style={styles.error}>{authError}</div>}

                {mode === "login" ? (
                    <form onSubmit={submitLogin} className="auth-form">
                        <div>
                            <label className="form-field-label" htmlFor="login-email">Email address</label>
                            <div className={`auth-field-wrap ${loginErrors.email ? "auth-field-error" : loginForm.email ? "auth-field-ok" : ""}`}>
                                <input
                                    id="login-email"
                                    style={styles.inputWide}
                                    className="field-input auth-field-input"
                                    type="email"
                                    name="email"
                                    placeholder="Email address"
                                    value={loginForm.email}
                                    onChange={handleLoginChange}
                                    autoComplete="email"
                                    disabled={busy}
                                />
                                {loginForm.email && !loginErrors.email ? <span className="auth-field-check">✓</span> : null}
                            </div>
                            {loginErrors.email ? <p className="auth-field-message">{loginErrors.email}</p> : null}
                        </div>

                        <div>
                            <label className="form-field-label" htmlFor="login-password">Password</label>
                            <div className={`auth-field-wrap ${loginErrors.password ? "auth-field-error" : loginForm.password ? "auth-field-ok" : ""}`}>
                                <input
                                    id="login-password"
                                    style={styles.inputWide}
                                    className="field-input auth-field-input"
                                    type={showLoginPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={loginForm.password}
                                    onChange={handleLoginChange}
                                    autoComplete="current-password"
                                    disabled={busy}
                                />
                                <button
                                    type="button"
                                    className="auth-toggle"
                                    onClick={() => setShowLoginPassword((previous) => !previous)}
                                >
                                    {showLoginPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            {loginErrors.password ? <p className="auth-field-message">{loginErrors.password}</p> : null}
                        </div>

                        <button style={styles.btnPrimary} className="primary-button auth-submit" type="submit" disabled={busy}>
                            {busy ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={submitSignup} className="auth-form">
                        {[
                            ["name", "text", "Full name", "name"],
                            ["email", "email", "Email address", "email"],
                            ["phone", "tel", "Phone number", "tel"],
                            ["age", "number", "Age", "off"],
                        ].map(([name, type, placeholder, autoComplete]) => (
                            <div key={name}>
                                <label className="form-field-label" htmlFor={`signup-${name}`}>{placeholder}</label>
                                <div className={`auth-field-wrap ${signupErrors[name] ? "auth-field-error" : signupForm[name] && !signupErrors[name] ? "auth-field-ok" : ""}`}>
                                    <input
                                        id={`signup-${name}`}
                                        style={styles.inputWide}
                                        className="field-input auth-field-input"
                                        type={type}
                                        name={name}
                                        placeholder={placeholder}
                                        value={signupForm[name]}
                                        onChange={handleSignupChange}
                                        onBlur={handleSignupBlur}
                                        autoComplete={autoComplete}
                                        disabled={busy}
                                        min={name === "age" ? 13 : undefined}
                                        max={name === "age" ? 120 : undefined}
                                    />
                                    {signupForm[name] && !signupErrors[name] ? <span className="auth-field-check">✓</span> : null}
                                </div>
                                {signupErrors[name] ? <p className="auth-field-message">{signupErrors[name]}</p> : null}
                            </div>
                        ))}

                        <div>
                            <label className="form-field-label" htmlFor="signup-password">Password</label>
                            <div className={`auth-field-wrap ${signupErrors.password ? "auth-field-error" : signupForm.password && !signupErrors.password ? "auth-field-ok" : ""}`}>
                                <input
                                    id="signup-password"
                                    style={styles.inputWide}
                                    className="field-input auth-field-input"
                                    type={showSignupPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={signupForm.password}
                                    onChange={handleSignupChange}
                                    onBlur={handleSignupBlur}
                                    autoComplete="new-password"
                                    disabled={busy}
                                />
                                <button
                                    type="button"
                                    className="auth-toggle"
                                    onClick={() => setShowSignupPassword((previous) => !previous)}
                                >
                                    {showSignupPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            {signupErrors.password ? <p className="auth-field-message">{signupErrors.password}</p> : null}

                            {signupForm.password ? (
                                <div className="auth-strength">
                                    <div className="auth-strength-bars">
                                        {[1, 2, 3, 4].map((value) => (
                                            <div
                                                key={value}
                                                className="auth-strength-bar"
                                                style={{ background: value <= passwordStrength ? STRENGTH_COLORS[passwordStrength] : "rgba(255,255,255,0.1)" }}
                                            />
                                        ))}
                                    </div>
                                    <span className="auth-strength-label" style={{ color: STRENGTH_COLORS[passwordStrength] }}>
                                        {STRENGTH_LABELS[passwordStrength]}
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        <button style={styles.btnPrimary} className="primary-button auth-submit" type="submit" disabled={busy}>
                            {busy ? "Creating..." : "Create Account"}
                        </button>
                    </form>
                )}

                <p className="auth-switch-copy">
                    {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
                    <button type="button" className="auth-switch-button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                        {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                </p>
            </div>
        </section>
    );
}
