import { styles } from "../styles";

export default function Header({ currentUser, onOpenProfile, onOpenHome, onOpenSupport, onOpenCheckIn, onOpenRecommendations, onOpenFreeChat, onLogout, busy, activeView }) {
    const isHomeView = activeView === "home";
    const isSupportView = activeView === "support";
    const isProfileView = activeView === "profile";
    const isCheckInView = activeView === "checkin";
    const isRecommendationsView = activeView === "recommendations";
    const isFreeChatView = activeView === "freechat";
    const initials = (currentUser?.name || "U").trim().charAt(0).toUpperCase();

    return (
        <header style={styles.header} className="app-header">
            <div className="header-top">
                <div className="header-brand">
                    <div className="header-brand-badge">Student Wellness Space</div>
                    <h1 style={styles.title}>Stress Support Assistant</h1>
                    <p style={styles.subTitle}>Take a few guided steps, reflect on what is going on, and get practical support you can use next.</p>
                </div>

                <div className="header-account-row">
                    <div className="header-user-chip">
                        <div className="header-user-avatar" aria-hidden="true">
                            {currentUser?.profilePhoto ? (
                                <img src={currentUser.profilePhoto} alt="" className="header-user-avatar-image" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="header-user-meta">
                            <span className="header-user-label">Signed in as</span>
                            <strong>{currentUser?.name || "Signed in user"}</strong>
                            <span>{currentUser?.email || "No email available"}</span>
                        </div>
                    </div>
                    <button
                        style={styles.btnGhost}
                        className="ghost-button header-logout"
                        onClick={onLogout}
                        disabled={busy}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div style={styles.userBox} className="header-actions">
                <div className="header-nav-shell">
                    <div className="header-nav">
                        <button
                            style={{ ...(isHomeView ? styles.btnPrimary : styles.btnGhost), ...styles.navBtn }}
                            className="ghost-button"
                            onClick={onOpenHome}
                            disabled={busy}
                        >
                            Home
                        </button>
                        <button
                            style={{ ...(isSupportView ? styles.btnPrimary : styles.btnGhost), ...styles.navBtn }}
                            className="ghost-button"
                            onClick={onOpenSupport}
                            disabled={busy}
                        >
                            Guided Support
                        </button>
                        <button
                            style={{ ...(isCheckInView ? styles.btnPrimary : styles.btnGhost), ...styles.navBtn }}
                            className="ghost-button"
                            onClick={onOpenCheckIn}
                            disabled={busy}
                        >
                            Daily Check-In
                        </button>
                        <button
                            style={{ ...(isRecommendationsView ? styles.btnPrimary : styles.btnGhost), ...styles.navBtn }}
                            className="ghost-button"
                            onClick={onOpenRecommendations}
                            disabled={busy}
                        >
                            Recommendations
                        </button>
                        <button
                            style={{ ...(isFreeChatView ? styles.btnPrimary : styles.btnGhost), ...styles.navBtn }}
                            className="ghost-button"
                            onClick={onOpenFreeChat}
                            disabled={busy}
                        >
                            Free Chat
                        </button>
                        <button
                            style={{ ...(isProfileView ? styles.btnPrimary : styles.btnGhost), ...styles.navBtn }}
                            className="ghost-button"
                            onClick={onOpenProfile}
                            disabled={busy}
                        >
                            Profile
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
