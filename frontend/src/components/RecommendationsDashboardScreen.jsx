import { useCallback, useEffect, useMemo, useState } from "react";
import StatusPanel from "./StatusPanel";
import { styles } from "../styles";
import { API_BASE, getFriendlyMessage } from "../utils/appHelpers";

function averageFrom(entries, key) {
    if (!entries.length) {
        return "0.0";
    }

    const total = entries.reduce((sum, entry) => sum + Number(entry[key] || 0), 0);
    return (total / entries.length).toFixed(1);
}

function formatShortDate(value) {
    if (!value) return "No date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function MetricSummary({ title, average, latest, accentClass, entries }) {
    return (
        <article className={`recommendation-metric-card ${accentClass}`}>
            <div className="recommendation-metric-head">
                <span className="checkin-kicker">{title}</span>
                <strong>{average}/5 avg</strong>
            </div>
            <div className="recommendation-metric-track">
                <span className="recommendation-metric-fill" style={{ width: `${(Number(average) / 5) * 100}%` }} />
            </div>
            <div className="recommendation-metric-footer">
                <span>Latest {latest}/5</span>
                <span>{entries} entries</span>
            </div>
        </article>
    );
}

function MetricChart({ entries }) {
    const recentEntries = [...entries].slice(0, 5).reverse();
    const stressAverage = averageFrom(recentEntries, "stressLevel");
    const energyAverage = averageFrom(recentEntries, "energyLevel");
    const sleepAverage = averageFrom(recentEntries, "sleepQuality");
    const latestEntry = recentEntries[recentEntries.length - 1];

    return (
        <div className="dashboard-chart-card">
            <div className="dashboard-surface-head">
                <div>
                    <span className="checkin-kicker">Trend View</span>
                    <h3>What your recent check-ins are signaling</h3>
                </div>
                <div className="recommendation-chart-note">
                    <strong>Latest mood</strong>
                    <span>{latestEntry?.mood || "No entries yet"}</span>
                </div>
            </div>

            <div className="recommendation-metric-grid">
                <MetricSummary
                    title="Stress"
                    average={stressAverage}
                    latest={latestEntry?.stressLevel || 0}
                    entries={recentEntries.length}
                    accentClass="recommendation-metric-stress"
                />
                <MetricSummary
                    title="Energy"
                    average={energyAverage}
                    latest={latestEntry?.energyLevel || 0}
                    entries={recentEntries.length}
                    accentClass="recommendation-metric-energy"
                />
                <MetricSummary
                    title="Sleep"
                    average={sleepAverage}
                    latest={latestEntry?.sleepQuality || 0}
                    entries={recentEntries.length}
                    accentClass="recommendation-metric-sleep"
                />
            </div>

            <div className="recommendation-timeline">
                {recentEntries.map((entry) => (
                    <div key={entry.id} className="recommendation-timeline-item">
                        <span className="recommendation-timeline-date">{formatShortDate(entry.date)}</span>
                        <strong>{entry.mood}</strong>
                        <div className="recommendation-timeline-metrics">
                            <span>Stress {entry.stressLevel}</span>
                            <span>Energy {entry.energyLevel}</span>
                            <span>Sleep {entry.sleepQuality}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getRecommendationTypeLabel(type) {
    const normalized = String(type || "").toUpperCase();
    if (normalized === "RESET") return "Reset";
    if (normalized === "BREATHING") return "Breathing";
    if (normalized === "CONNECTION") return "Connection";
    if (normalized === "REFLECTION") return "Reflection";
    return type || "Support";
}

function getRecommendationModeMeta(source) {
    if (String(source || "").toLowerCase() === "gemini") {
        return {
            label: "Gemini Live",
            detail: "AI-generated and RAG-informed guidance is active.",
            className: "recommendation-source-badge is-gemini",
        };
    }

    return {
        label: "Fallback Active",
        detail: "The app is using local support guidance while live Gemini is unavailable.",
        className: "recommendation-source-badge is-fallback",
    };
}

function RecommendationCard({ item, onSave, onDone, pendingId }) {
    const isPending = pendingId === item.id;

    return (
        <article className="recommendation-item-card">
            <div className="recommendation-item-copy">
                <div className="recommendation-item-top">
                    <span className="recommendation-type-chip">{getRecommendationTypeLabel(item.type)}</span>
                    <span className={`recommendation-status-chip${item.done ? " is-done" : item.saved ? " is-saved" : ""}`}>
                        {item.done ? "Done" : item.saved ? "Saved" : "Ready"}
                    </span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
            </div>

            <div className="recommendation-item-actions">
                <button
                    type="button"
                    style={styles.btnGhost}
                    className="ghost-button"
                    onClick={() => onSave(item.id)}
                    disabled={isPending || item.saved}
                >
                    {item.saved ? "Saved" : "Save"}
                </button>
                <button
                    type="button"
                    style={styles.btnPrimary}
                    className="primary-button"
                    onClick={() => onDone(item.id)}
                    disabled={isPending || item.done}
                >
                    {item.done ? "Done" : isPending ? "Updating..." : "Mark Done"}
                </button>
            </div>
        </article>
    );
}

function formatEntryDate(value) {
    if (!value) return "No date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export default function RecommendationsDashboardScreen({ currentUser }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [pendingId, setPendingId] = useState(null);

    const userId = currentUser?.id;

    const loadDashboard = useCallback(async () => {
        if (!userId) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            const response = await fetch(`${API_BASE}/api/dashboard?userId=${userId}`);
            if (!response.ok) {
                throw new Error("We couldn't load your recommendations dashboard right now.");
            }
            setDashboard(await response.json());
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't load your recommendations dashboard right now."));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        setActionError("");
        loadDashboard();
    }, [loadDashboard]);

    const handleAction = useCallback(async (recommendationId, action) => {
        if (!userId) {
            return;
        }

        try {
            setPendingId(recommendationId);
            setActionError("");
            const response = await fetch(`${API_BASE}/api/recommendations/${recommendationId}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error("We couldn't update that recommendation right now.");
            }

            await loadDashboard();
        } catch (e) {
            setActionError(getFriendlyMessage(e, "We couldn't update that recommendation right now."));
        } finally {
            setPendingId(null);
        }
    }, [loadDashboard, userId]);

    const stats = useMemo(() => ([
        { label: "Wellbeing Score", value: `${dashboard?.wellbeingScore ?? 0}/5`, detail: "Based on recent check-ins" },
        { label: "Recommendations Done", value: dashboard?.doneCount ?? 0, detail: "Completed support actions" },
        { label: "Recommendations Saved", value: dashboard?.savedCount ?? 0, detail: "Kept for later" },
        { label: "Entries Used", value: dashboard?.recentMoods?.length ?? 0, detail: "Recent mood check-ins" },
    ]), [dashboard]);

    const latestEntries = dashboard?.recentMoods || [];
    const recommendations = dashboard?.recommendations || [];
    const recommendationMode = getRecommendationModeMeta(dashboard?.recommendationSource);
    const primaryRecommendation = recommendations[0] || null;
    const secondaryRecommendations = recommendations.slice(1);

    return (
        <section className="recommendations-shell">
            <section className="hero-panel recommendations-hero">
                <div className="recommendations-hero-copy">
                    <div className="recommendations-hero-badges">
                        <span style={styles.badge}>Recommendations</span>
                        <span className={recommendationMode.className}>{recommendationMode.label}</span>
                    </div>
                    <h2 className="recommendations-hero-title">Turn your recent patterns into one clearer next step.</h2>
                    <p className="recommendations-hero-text">
                        This dashboard reads your latest check-ins, spots the clearest support signal, and keeps the most useful actions close at hand.
                    </p>
                    <p className="recommendation-mode-detail">{recommendationMode.detail}</p>
                </div>

                <div className="hero-stats recommendations-hero-stats">
                    {stats.map((item) => (
                        <div key={item.label} className="hero-stat-card recommendations-stat-card">
                            <span className="hero-stat-label">{item.label}</span>
                            <strong>{item.value}</strong>
                            <small>{item.detail}</small>
                        </div>
                    ))}
                </div>
            </section>

            {actionError ? (
                <StatusPanel tone="error" title="A recommendation action did not save" message={actionError} />
            ) : null}

            {loading ? (
                <StatusPanel
                    tone="neutral"
                    title="Loading your recommendations dashboard"
                    message="Pulling together recent mood entries, trend signals, and support actions."
                />
            ) : error ? (
                <StatusPanel
                    tone="error"
                    title="The recommendations dashboard is unavailable"
                    message={error}
                    action={{ label: "Try again", onClick: loadDashboard }}
                />
            ) : latestEntries.length === 0 ? (
                <StatusPanel
                    tone="warning"
                    title="Your dashboard needs a few daily check-ins first"
                    message="Add some daily check-ins and this view will turn them into trend lines and tailored recommendations."
                />
            ) : (
                <div className="recommendations-grid">
                    <div className="recommendations-main">
                        <MetricChart entries={latestEntries} />

                        <div className="dashboard-recent-card">
                            <div className="dashboard-surface-head">
                                <div>
                                    <span className="checkin-kicker">Recent Check-Ins</span>
                                    <h3>The entries shaping this dashboard</h3>
                                </div>
                                <p>The latest snapshots behind the current support suggestions.</p>
                            </div>

                            <div className="dashboard-entry-list">
                                {latestEntries.map((entry) => (
                                    <article key={entry.id} className="dashboard-entry-card">
                                        <div>
                                            <strong>{entry.mood}</strong>
                                            <span>{formatEntryDate(entry.date)}</span>
                                        </div>
                                        <div className="dashboard-entry-metrics">
                                            <span>Stress {entry.stressLevel}</span>
                                            <span>Energy {entry.energyLevel}</span>
                                            <span>Sleep {entry.sleepQuality}</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="recommendations-side">
                        <div className="dashboard-recommendations-card">
                            <div className="dashboard-surface-head">
                                <div>
                                    <span className="checkin-kicker">Suggested Support</span>
                                    <h3>Recommendations matched to your recent pattern</h3>
                                </div>
                                <p>Save the helpful ones for later or mark them done as you work through them.</p>
                            </div>

                            {recommendations.length === 0 ? (
                                <StatusPanel
                                    tone="warning"
                                    title="No tailored recommendations just yet"
                                    message="Keep logging how the day feels and the app will match more targeted support actions here."
                                />
                            ) : (
                                <>
                                    {primaryRecommendation ? (
                                        <div className="recommendation-primary-block">
                                            <span className="recommendation-primary-kicker">Start here</span>
                                            <RecommendationCard
                                                item={primaryRecommendation}
                                                onSave={(recommendationId) => handleAction(recommendationId, "save")}
                                                onDone={(recommendationId) => handleAction(recommendationId, "done")}
                                                pendingId={pendingId}
                                            />
                                        </div>
                                    ) : null}

                                    {secondaryRecommendations.length ? (
                                        <div className="recommendation-item-list recommendation-secondary-list">
                                            {secondaryRecommendations.map((item) => (
                                                <RecommendationCard
                                                    key={item.id}
                                                    item={item}
                                                    onSave={(recommendationId) => handleAction(recommendationId, "save")}
                                                    onDone={(recommendationId) => handleAction(recommendationId, "done")}
                                                    pendingId={pendingId}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
