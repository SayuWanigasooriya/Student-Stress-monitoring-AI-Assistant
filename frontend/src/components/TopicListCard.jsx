import { styles } from "../styles";

export default function TopicListCard({ loadingTopics, topics, startSession, busy, userId }) {
    return (
        <div style={styles.card} className="panel-card">
            <div style={styles.cardTop} className="panel-card-top">
                <div>
                    <div style={styles.badge}>TOPICS</div>
                    <h2 style={styles.cardTitle}>Choose a topic to begin</h2>
                    <p className="section-helper">Choose the area you want support with, then move through the questions one step at a time.</p>
                </div>
            </div>

            {loadingTopics ? (
                <p style={styles.muted}>Getting your support topics ready…</p>
            ) : topics.length === 0 ? (
                <div className="empty-state-card">
                    <strong>No topics are available right now.</strong>
                    <p>Give it a moment and try again. If this keeps happening, check that the backend is running.</p>
                </div>
            ) : (
                <div style={styles.topicList} className="topic-grid">
                    {topics.map((topic) => (
                        <div key={topic.id} style={styles.topicItem} className="topic-card">
                            <div>
                                <div style={styles.topicName}>{topic.name}</div>
                                <div style={styles.topicDesc}>{topic.description}</div>
                                <div style={styles.topicId}>{topic.id}</div>
                            </div>
                            <button
                                style={styles.btnPrimary}
                                className="primary-button"
                                onClick={() => startSession(topic.id)}
                                disabled={busy || !userId}
                            >
                                {userId ? "Begin" : "Sign in to continue"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
