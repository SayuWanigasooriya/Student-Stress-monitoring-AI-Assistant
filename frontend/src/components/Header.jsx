import { styles } from "../styles";

export default function Header({ currentUser, onOpenProfile, onOpenHome, onLogout, busy, isProfileView }) {
    return (
        <header style={styles.header} className="app-header">
            <div>
                <h1 style={styles.title}>Stress Support Assistant</h1>
                <p style={styles.subTitle}>Take a few guided steps, reflect on what is going on, and get practical support you can use next.</p>
            </div>

            <div style={styles.userBox} className="user-box">
                <div className="header-user-meta">
                    <strong>{currentUser?.name || "Signed in user"}</strong>
                    <span>{currentUser?.email || "No email available"}</span>
                </div>
                <button
                    style={styles.btnGhost}
                    className="ghost-button"
                    onClick={isProfileView ? onOpenHome : onOpenProfile}
                    disabled={busy}
                >
                    {isProfileView ? "Back to Support" : "Profile"}
                </button>
                <button style={styles.btn} className="secondary-button" onClick={onLogout} disabled={busy}>
                    Logout
                </button>
            </div>
        </header>
    );
}
