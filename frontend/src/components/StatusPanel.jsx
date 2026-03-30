import { styles } from "../styles";

export default function StatusPanel({ tone = "neutral", title, message, action }) {
    const className = `status-panel status-${tone}`;

    return (
        <div className={className}>
            <strong>{title}</strong>
            <p>{message}</p>
            {action ? (
                <button
                    type="button"
                    style={styles.btnGhost}
                    className="ghost-button"
                    onClick={action.onClick}
                >
                    {action.label}
                </button>
            ) : null}
        </div>
    );
}
