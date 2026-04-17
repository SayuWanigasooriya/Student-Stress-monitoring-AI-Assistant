import { styles } from "../styles";
import StatusPanel from "./StatusPanel";

const TOPIC_ACCENTS = {
    academic_stress: { badge: "Study load", tone: "topic-card-academic" },
    anxiety: { badge: "Calm support", tone: "topic-card-anxiety" },
    relationships: { badge: "Connection", tone: "topic-card-relationships" },
};

export default function TopicListCard({ loadingTopics, topics, startSession, busy, userId, onRetry }) {
    return (
        <div style={styles.card} className="panel-card">
            <div style={styles.cardTop} className="panel-card-top">
                <div>
                    <div style={styles.badge}>TOPICS</div>
                    <h2 style={styles.cardTitle}>Choose a topic to begin</h2>
                    <p className="section-helper">Choose the area you want support with, then move through the questions one step at a time. Start with the one that feels most immediate today.</p>
                </div>
            </div>

            {loadingTopics ? (
                <StatusPanel
                    tone="neutral"
                    title="Getting your support topics ready"
                    message="Pulling in the guided areas so you can pick up from a calmer starting point."
                />
            ) : topics.length === 0 ? (
                <StatusPanel
                    tone="warning"
                    title="No topics are available right now"
                    message="Give it a moment and try again. If this keeps happening, check that the backend is running."
                    action={onRetry ? { label: "Reload topics", onClick: onRetry } : undefined}
                />
            ) : (
                <div style={styles.topicList} className="topic-grid">
                    {topics.map((topic) => (
                        <div
                            key={topic.id}
                            style={styles.topicItem}
                            className={`topic-card ${TOPIC_ACCENTS[topic.id?.toLowerCase()]?.tone || ""}`}
                        >
                            <div className="topic-card-copy">
                                <div className="topic-card-header">
                                    <span className="topic-card-badge">
                                        {TOPIC_ACCENTS[topic.id?.toLowerCase()]?.badge || "Guided topic"}
                                    </span>
                                    <span className="topic-card-meta">Step-by-step</span>
                                </div>
                                <div style={styles.topicName}>{topic.name}</div>
                                <div style={styles.topicDesc}>{topic.description}</div>
                                <div style={styles.topicId}>{topic.id}</div>
                            </div>
                            <button
                                style={styles.btnPrimary}
                                className="primary-button topic-card-button"
                                onClick={() => startSession(topic.id)}
                                disabled={busy || !userId}
                            >
                                {userId ? "Start topic" : "Sign in to continue"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
