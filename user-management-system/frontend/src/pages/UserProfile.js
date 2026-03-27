import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080";

const RULES = {
  name(v) {
    if (!v.trim()) return "Full name is required.";
    if (v.trim().length < 2) return "Name must be at least 2 characters.";
    if (!/^[a-zA-Z\s'-]+$/.test(v)) return "Name can only contain letters, spaces, hyphens, or apostrophes.";
  },
  email(v) {
    if (!v.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  },
  phone(v) {
    if (!v.trim()) return "Phone number is required.";
    if (!/^\d{10}$/.test(v.trim())) return "Phone number must be exactly 10 digits.";
  },
  age(v) {
    if (v === "" || v === null || v === undefined) return "Age is required.";
    const n = Number(v);
    if (!Number.isInteger(n) || n < 13 || n > 120) return "Age must be between 13 and 120.";
  },
};

function Field({ label, value }) {
  return (
    <div className="pf-field">
      <div>
        <div className="pf-field-label">{label}</div>
        <div className="pf-field-value">{value || <span style={{ opacity: 0.4 }}>—</span>}</div>
      </div>
    </div>
  );
}

function UserProfile({ setAuth }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", age: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      setFormData({ name: u.name ?? "", email: u.email ?? "", phone: u.phone ?? "", age: u.age ?? "" });
      setPhoto(u.profilePhoto || null);
    }
  }, []);

  const initials = useMemo(() => {
    const parts = (user?.name || "U").trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      flash("Image must be smaller than 5MB.", true);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      // resize to max 800px and compress to JPEG 0.7
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setPhoto(dataUrl);
      try {
        const res = await fetch(`${API_BASE}/api/users/${user.id}/photo`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePhoto: dataUrl }),
        });
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const updated = await res.json();
        localStorage.setItem("currentUser", JSON.stringify(updated));
        setUser(updated);
        flash("Photo saved successfully!");
      } catch (err) {
        flash(err.message || "Failed to save photo.", true);
      }
    };
    img.src = objectUrl;
  };

  const handleRemovePhoto = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhoto: null }),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const updated = await res.json();
      localStorage.setItem("currentUser", JSON.stringify(updated));
      setUser(updated);
      setPhoto(null);
      fileRef.current.value = "";
      flash("Photo removed.");
    } catch (err) {
      flash(err.message || "Failed to remove photo.", true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    // live-clear error as user fixes the field
    if (fieldErrors[name]) {
      setFieldErrors((p) => ({ ...p, [name]: RULES[name]?.(value) || "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const msg = RULES[name]?.(value);
    if (msg) setFieldErrors((p) => ({ ...p, [name]: msg }));
  };

  const flash = (msg, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => (isErr ? setError("") : setSuccess("")), 3000);
  };

  const handleUpdate = async () => {
    if (!user?.id) return;
    // validate all fields before submit
    const errs = {};
    Object.keys(RULES).forEach((k) => {
      const msg = RULES[k](String(formData[k] ?? ""));
      if (msg) errs[k] = msg;
    });
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    try {
      setBusy(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, age: formData.age === "" ? null : Number(formData.age) }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const updated = await res.json();
      localStorage.setItem("currentUser", JSON.stringify(updated));
      setUser(updated);
      setFormData({ name: updated.name ?? "", email: updated.email ?? "", phone: updated.phone ?? "", age: updated.age ?? "" });
      setFieldErrors({});
      setIsEditing(false);
      flash("Profile updated successfully!");
    } catch (err) {
      flash(err.message || "Update failed", true);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      localStorage.removeItem("currentUser");
      setAuth(false);
      navigate("/login");
    } catch (err) {
      flash(err.message || "Delete failed", true);
      setShowDeleteModal(false);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setAuth(false);
    navigate("/login");
  };

  const cancelEdit = () => {
    setError("");
    setFieldErrors({});
    setIsEditing(false);
    setFormData({ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "", age: user.age ?? "" });
  };

  const EDIT_FIELDS = [
    { name: "name",  type: "text",   placeholder: "Full Name"    },
    { name: "email", type: "email",  placeholder: "Email Address" },
    { name: "phone", type: "tel",    placeholder: "Phone Number"  },
    { name: "age",   type: "number", placeholder: "Age"           },
  ];

  if (!user) {
    return (
      <div className="pf-container">
        <div className="pf-skeleton">
          <div className="pf-skeleton-avatar" />
          <div className="pf-skeleton-lines"><div /><div /><div /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-container">
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="pf-modal-overlay">
          <div className="pf-modal">
            <div className="pf-modal-icon">⚠️</div>
            <h3>Delete Account?</h3>
            <p>This action is permanent and cannot be undone.</p>
            <div className="pf-modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)} disabled={busy}>Cancel</button>
              <button className="btn-delete" onClick={handleDelete} disabled={busy}>
                {busy ? <span className="btn-spinner" /> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pf-card">
        {/* Header */}
        <div className="pf-header">
          <div>
            <span className="pf-badge">PROFILE</span>
            <h2 className="pf-title">My Profile</h2>
            <p className="pf-subtitle">Manage your personal information</p>
          </div>
          <button className="btn-logout" onClick={handleLogout} disabled={busy}>Logout</button>
        </div>

        {/* Alerts */}
        {error   && <div className="pf-alert pf-alert-error">⚠ {error}</div>}
        {success && <div className="pf-alert pf-alert-success">✓ {success}</div>}

        {/* Avatar */}
        <div className="pf-avatar-section">
          <div className="pf-avatar-wrap" onClick={() => fileRef.current.click()} title="Click to change photo">
            {photo
              ? <img src={photo} alt="avatar" className="pf-avatar-img" />
              : <div className="pf-avatar-initials">{initials}</div>
            }
            <div className="pf-avatar-overlay"><span>Upload</span></div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
          <div className="pf-avatar-info">
            <div className="pf-name">{user.name}</div>
            <div className="pf-email">{user.email}</div>
            <div className="pf-avatar-btns">
              <div className="pf-upload-hint" onClick={() => fileRef.current.click()}>Upload photo</div>
              {photo && (
                <div className="pf-remove-hint" onClick={handleRemovePhoto}>Remove photo</div>
              )}
            </div>
          </div>
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="pf-details">
            <div className="pf-fields-grid">
              <Field label="Full Name"     value={user.name}  />
              <Field label="Email Address" value={user.email} />
              <Field label="Phone Number"  value={user.phone} />
              <Field label="Age"           value={user.age}   />
            </div>
            <div className="pf-actions">
              <button className="btn-edit" onClick={() => { setError(""); setIsEditing(true); }} disabled={busy}>
                Edit Profile
              </button>
              <button className="btn-delete" onClick={() => setShowDeleteModal(true)} disabled={busy}>
                Delete Account
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="pf-edit-form">
            <div className="pf-fields-grid">
              {EDIT_FIELDS.map(({ name, type, placeholder }) => {
                const hasError = !!fieldErrors[name];
                const isOk     = !hasError && String(formData[name] ?? "").trim() !== "";
                return (
                  <div key={name}>
                    <div className={`field-wrap ${hasError ? "field-error" : isOk ? "field-ok" : ""}`}>
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        disabled={busy}
                        min={name === "age" ? 13 : undefined}
                        max={name === "age" ? 120 : undefined}
                      />
                      {isOk && <span className="field-check">✓</span>}
                    </div>
                    {hasError && <p className="field-msg">{fieldErrors[name]}</p>}
                  </div>
                );
              })}
            </div>
            <div className="pf-actions" style={{ marginTop: 4 }}>
              <button className="btn-save" onClick={handleUpdate} disabled={busy}>
                {busy ? <span className="btn-spinner" /> : "Save Changes"}
              </button>
              <button className="btn-cancel" onClick={cancelEdit} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
