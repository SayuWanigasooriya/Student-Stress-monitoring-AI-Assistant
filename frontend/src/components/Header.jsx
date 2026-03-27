import { styles } from "../styles";

export default function Header({ currentUser, onOpenProfile, onOpenHome, onLogout, busy, isProfileView }) {
    return (
        <header style={styles.header} className="app-header">
            <div>
                <h1 style={styles.title}>Topic Guidance</h1>
                <p style={styles.subTitle}>Answer a few guided questions and get supportive next steps for what you are dealing with.</p>
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
                    {isProfileView ? "Back Home" : "Profile"}
                </button>
                <button style={styles.btn} className="secondary-button" onClick={onLogout} disabled={busy}>
                    Logout
                </button>
            </div>
        </header>
    );
}
