import { styles } from "../styles";

export default function Header({ userIdDraft, setUserIdDraft, saveUserId, busy }) {
    return (
        <header style={styles.header} className="app-header">
            <div>
                <h1 style={styles.title}>Topic Guidance</h1>
                <p style={styles.subTitle}>Answer a few guided questions and get supportive next steps for what you are dealing with.</p>
            </div>

            <div style={styles.userBox} className="user-box">
                <input
                    style={styles.input}
                    className="field-input"
                    placeholder="User ID (e.g., user-001)"
                    value={userIdDraft}
                    onChange={(e) => setUserIdDraft(e.target.value)}
                />
                <button style={styles.btn} className="secondary-button" onClick={saveUserId} disabled={busy}>
                    Save
                </button>
            </div>
        </header>
    );
}
