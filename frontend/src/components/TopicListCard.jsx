import { styles } from "../styles";

export default function TopicListCard({ loadingTopics, topics, startSession, busy, userId }) {
    return (
        <div style={styles.card} className="panel-card">
            <div style={styles.cardTop} className="panel-card-top">
                <div>
                    <div style={styles.badge}>TOPICS</div>
                    <h2 style={styles.cardTitle}>Choose a topic to begin</h2>
                    <p className="section-helper">Pick the area you want help with, then move through the guided questions at your own pace.</p>
                </div>
            </div>

            {loadingTopics ? (
                <p style={styles.muted}>Loading topics…</p>
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
                                {userId ? "Start" : "Save User ID First"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
