import { useEffect, useMemo, useRef, useState } from "react";
import { styles } from "../styles";

const RULES = {
    name(value) {
        if (!value.trim()) return "Full name is required.";
        if (value.trim().length < 2) return "Name must be at least 2 characters.";
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Name can only contain letters, spaces, hyphens, or apostrophes.";
    },
    email(value) {
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
    },
    phone(value) {
        if (!value.trim()) return "Phone number is required.";
        if (!/^\d{10}$/.test(value.trim())) return "Phone number must be exactly 10 digits.";
    },
    age(value) {
        if (value === "" || value === null || value === undefined) return "Age is required.";
        const number = Number(value);
        if (!Number.isInteger(number) || number < 13 || number > 120) return "Age must be between 13 and 120.";
    },
};

function Field({ label, value }) {
    return (
        <div className="profile-field-card">
            <div className="profile-field-label">{label}</div>
            <div className="profile-field-value">{value || <span style={{ opacity: 0.45 }}>-</span>}</div>
        </div>
    );
}

export default function ProfileScreen({ currentUser, userApiBase, onUserUpdated, onLogout }) {
    const [user, setUser] = useState(currentUser);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.name ?? "",
        email: currentUser?.email ?? "",
        phone: currentUser?.phone ?? "",
        age: currentUser?.age ?? "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [photo, setPhoto] = useState(currentUser?.profilePhoto ?? null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        setUser(currentUser);
        setPhoto(currentUser?.profilePhoto ?? null);
        setFormData({
            name: currentUser?.name ?? "",
            email: currentUser?.email ?? "",
            phone: currentUser?.phone ?? "",
            age: currentUser?.age ?? "",
        });
    }, [currentUser]);

    const initials = useMemo(() => {
        const parts = (user?.name || "U").trim().split(/\s+/);
        return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
    }, [user]);

    const flash = (message, isError = false) => {
        if (isError) {
            setError(message);
            setSuccess("");
        } else {
            setSuccess(message);
            setError("");
        }
        window.setTimeout(() => {
            if (isError) setError("");
            else setSuccess("");
        }, 3000);
    };

    const persistUser = (updatedUser) => {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setPhoto(updatedUser.profilePhoto || null);
        setFormData({
            name: updatedUser.name ?? "",
            email: updatedUser.email ?? "",
            phone: updatedUser.phone ?? "",
            age: updatedUser.age ?? "",
        });
        onUserUpdated(updatedUser);
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;

        if (file.size > 5 * 1024 * 1024) {
            flash("Image must be smaller than 5MB.", true);
            return;
        }

        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = async () => {
            URL.revokeObjectURL(objectUrl);

            const maxDimension = 800;
            const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

            try {
                setBusy(true);
                const response = await fetch(`${userApiBase}/api/users/${user.id}/photo`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profilePhoto: dataUrl }),
                });
                if (!response.ok) throw new Error(`Photo update failed (${response.status})`);
                const updatedUser = await response.json();
                persistUser(updatedUser);
                flash("Photo saved successfully!");
            } catch (updateError) {
                flash(updateError.message || "Failed to save photo.", true);
            } finally {
                setBusy(false);
            }
        };
        image.src = objectUrl;
    };

    const handleRemovePhoto = async () => {
        if (!user?.id) return;
        try {
            setBusy(true);
            const response = await fetch(`${userApiBase}/api/users/${user.id}/photo`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profilePhoto: null }),
            });
            if (!response.ok) throw new Error(`Photo removal failed (${response.status})`);
            const updatedUser = await response.json();
            if (fileRef.current) fileRef.current.value = "";
            persistUser(updatedUser);
            flash("Photo removed.");
        } catch (removeError) {
            flash(removeError.message || "Failed to remove photo.", true);
        } finally {
            setBusy(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((previous) => ({ ...previous, [name]: RULES[name]?.(value) || "" }));
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        const message = RULES[name]?.(value);
        if (message) setFieldErrors((previous) => ({ ...previous, [name]: message }));
    };

    const handleUpdate = async () => {
        if (!user?.id) return;

        const nextErrors = {};
        Object.keys(RULES).forEach((key) => {
            const message = RULES[key](String(formData[key] ?? ""));
            if (message) nextErrors[key] = message;
        });

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            return;
        }

        try {
            setBusy(true);
            setError("");

            const response = await fetch(`${userApiBase}/api/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    age: Number(formData.age),
                    profilePhoto: photo,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || `Update failed (${response.status})`);
            }

            const updatedUser = await response.json();
            persistUser(updatedUser);
            setFieldErrors({});
            setIsEditing(false);
            flash("Profile updated successfully!");
        } catch (updateError) {
            flash(updateError.message || "Update failed.", true);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!user?.id) return;
        try {
            setBusy(true);
            const response = await fetch(`${userApiBase}/api/users/${user.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error(`Delete failed (${response.status})`);
            localStorage.removeItem("currentUser");
            onLogout();
        } catch (deleteError) {
            flash(deleteError.message || "Delete failed.", true);
            setShowDeleteModal(false);
        } finally {
            setBusy(false);
        }
    };

    const cancelEdit = () => {
        setFieldErrors({});
        setError("");
        setIsEditing(false);
        setFormData({
            name: user?.name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
            age: user?.age ?? "",
        });
    };

    if (!user) return null;

    const editFields = [
        { name: "name", type: "text", placeholder: "Full Name" },
        { name: "email", type: "email", placeholder: "Email Address" },
        { name: "phone", type: "tel", placeholder: "Phone Number" },
        { name: "age", type: "number", placeholder: "Age" },
    ];

    return (
        <section className="profile-layout">
            {showDeleteModal ? (
                <div className="profile-modal-overlay">
                    <div className="profile-modal">
                        <div className="profile-modal-icon">Delete</div>
                        <h3>Delete Account?</h3>
                        <p>This action is permanent and cannot be undone.</p>
                        <div className="profile-modal-actions">
                            <button style={styles.btnGhost} className="ghost-button" onClick={() => setShowDeleteModal(false)} disabled={busy}>
                                Cancel
                            </button>
                            <button style={styles.btn} className="secondary-button danger-button" onClick={handleDelete} disabled={busy}>
                                {busy ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div style={styles.card} className="profile-card-shell">
                <div className="profile-header">
                    <div>
                        <div style={styles.badge}>PROFILE</div>
                        <h2 style={styles.cardTitle}>My Profile</h2>
                        <p className="section-helper">Manage your account details before starting or continuing a guidance session.</p>
                    </div>
                </div>

                {error ? <div style={styles.error}>{error}</div> : null}
                {success ? <div className="profile-success-banner">{success}</div> : null}

                <div className="profile-hero">
                    <div className="profile-avatar-wrap" onClick={() => fileRef.current?.click()} title="Click to change photo">
                        {photo ? <img src={photo} alt="Profile avatar" className="profile-avatar-image" /> : <div className="profile-avatar-initials">{initials}</div>}
                        <div className="profile-avatar-overlay"><span>Upload</span></div>
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handlePhotoChange}
                    />

                    <div className="profile-identity">
                        <div className="profile-name">{user.name}</div>
                        <div className="profile-email">{user.email}</div>
                        <div className="profile-avatar-actions">
                            <button type="button" className="profile-link-button" onClick={() => fileRef.current?.click()}>
                                Upload photo
                            </button>
                            {photo ? (
                                <button type="button" className="profile-link-button profile-link-danger" onClick={handleRemovePhoto}>
                                    Remove photo
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {!isEditing ? (
                    <>
                        <div className="profile-fields-grid">
                            <Field label="Full Name" value={user.name} />
                            <Field label="Email Address" value={user.email} />
                            <Field label="Phone Number" value={user.phone} />
                            <Field label="Age" value={user.age} />
                        </div>

                        <div className="profile-actions">
                            <button style={styles.btnPrimary} className="primary-button" onClick={() => setIsEditing(true)} disabled={busy}>
                                Edit Profile
                            </button>
                            <button style={styles.btnGhost} className="ghost-button danger-button" onClick={() => setShowDeleteModal(true)} disabled={busy}>
                                Delete Account
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="profile-fields-grid">
                            {editFields.map(({ name, type, placeholder }) => {
                                const hasError = Boolean(fieldErrors[name]);
                                const isOk = !hasError && String(formData[name] ?? "").trim() !== "";
                                return (
                                    <div key={name}>
                                        <div className={`auth-field-wrap ${hasError ? "auth-field-error" : isOk ? "auth-field-ok" : ""}`}>
                                            <input
                                                style={styles.inputWide}
                                                className="field-input auth-field-input"
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
                                            {isOk ? <span className="auth-field-check">✓</span> : null}
                                        </div>
                                        {hasError ? <p className="auth-field-message">{fieldErrors[name]}</p> : null}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="profile-actions">
                            <button style={styles.btnPrimary} className="primary-button" onClick={handleUpdate} disabled={busy}>
                                {busy ? "Saving..." : "Save Changes"}
                            </button>
                            <button style={styles.btnGhost} className="ghost-button" onClick={cancelEdit} disabled={busy}>
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
