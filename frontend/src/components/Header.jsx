import { styles } from "../styles";

export default function Header({ currentUser, onOpenProfile, onOpenHome, onOpenCheckIn, onLogout, busy, activeView }) {
    const isProfileView = activeView === "profile";
    const isCheckInView = activeView === "checkin";

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
                    onClick={onOpenHome}
                    disabled={busy}
                >
                    Home
                </button>
                <button
                    style={isCheckInView ? styles.btnPrimary : styles.btnGhost}
                    className="ghost-button"
                    onClick={onOpenCheckIn}
                    disabled={busy}
                >
                    Daily Check-In
                </button>
                <button
                    style={isProfileView ? styles.btnPrimary : styles.btnGhost}
                    className="ghost-button"
                    onClick={onOpenProfile}
                    disabled={busy}
                >
                    Profile
                </button>
                <button style={styles.btn} className="secondary-button" onClick={onLogout} disabled={busy}>
                    Logout
                </button>
            </div>
        </header>
    );
}
