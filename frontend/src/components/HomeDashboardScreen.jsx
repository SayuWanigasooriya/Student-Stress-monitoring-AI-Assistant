import { useCallback, useEffect, useMemo, useState } from "react";
import StatusPanel from "./StatusPanel";
import { styles } from "../styles";
import { API_BASE, getFriendlyMessage } from "../utils/appHelpers";

function getStressLabel(value) {
    if (value >= 4) {
        return "High";
    }
    if (value >= 3) {
        return "Moderate";
    }
    return "Low";
}

function formatShortDay(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

function DashboardMiniChart({ entries }) {
    const width = 340;
    const height = 138;
    const ordered = [...entries].reverse();
    const leftAxisWidth = 42;
    const chartWidth = width - leftAxisWidth;
    const points = ordered.map((entry, index) => {
        const x = ordered.length > 1 ? leftAxisWidth + index * (chartWidth / (ordered.length - 1)) : leftAxisWidth + chartWidth / 2;
        const value = Number(entry.stressLevel || 0);
        const y = height - ((value - 1) / 4) * height;
        return `${x},${y}`;
    }).join(" ");
    const areaPoints = points ? `${leftAxisWidth},${height} ${points} ${width},${height}` : "";
    const latestStress = Number(entries[0]?.stressLevel || 0);
    const dayLabels = ordered.map((entry, index) => ({
        id: entry.id ?? index,
        label: formatShortDay(entry.date) || `Day ${index + 1}`,
        x: ordered.length > 1 ? leftAxisWidth + index * (chartWidth / (ordered.length - 1)) : leftAxisWidth + chartWidth / 2,
    }));

    if (!entries.length) {
        return <div className="home-chart-empty">No recent check-ins yet</div>;
    }

    return (
        <div className="home-mini-chart-shell">
            <div className="home-mini-chart-caption">
                <span>Stress over the last 5 check-ins</span>
                <strong>Latest: {getStressLabel(latestStress)} ({entries[0]?.stressLevel || "--"}/5)</strong>
            </div>
            <div className="home-mini-chart-frame">
                <svg viewBox={`0 0 ${width} ${height}`} className="home-mini-chart" role="img" aria-label="Stress level over the last 5 check-ins">
                {[1, 2, 3, 4, 5].map((value) => {
                    const y = height - ((value - 1) / 4) * height;
                    return (
                        <g key={value}>
                            <line x1={leftAxisWidth} y1={y} x2={width} y2={y} className="home-mini-chart-grid" />
                            <text x={0} y={y + 4} className="home-mini-chart-axis-label">
                                {value === 5 ? "High" : value === 3 ? "Mid" : value === 1 ? "Low" : ""}
                            </text>
                        </g>
                    );
                })}
                <polygon points={areaPoints} className="home-mini-chart-area" />
                <polyline
                    fill="none"
                    stroke="#d49b5f"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
                {ordered.map((entry, index) => {
                    const x = ordered.length > 1 ? leftAxisWidth + index * (chartWidth / (ordered.length - 1)) : leftAxisWidth + chartWidth / 2;
                    const y = height - ((Number(entry.stressLevel || 0) - 1) / 4) * height;
                    return <circle key={entry.id ?? index} cx={x} cy={y} r="4.5" className="home-mini-chart-dot" />;
                })}
                </svg>
                <div className="home-mini-chart-days" aria-hidden="true">
                    {dayLabels.map((item) => (
                        <span key={item.id} style={{ left: `${(item.x / width) * 100}%` }}>
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function QuickActionCard({ eyebrow, title, text, actionLabel, onClick }) {
    return (
        <article className="home-action-card">
            <span className="checkin-kicker">{eyebrow}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <button type="button" style={styles.btnPrimary} className="primary-button home-action-button" onClick={onClick}>
                {actionLabel}
            </button>
        </article>
    );
}

export default function HomeDashboardScreen({
    currentUser,
    topics,
    onOpenSupport,
    onOpenCheckIn,
    onOpenRecommendations,
}) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                throw new Error("We couldn't load your home overview right now.");
            }
            setDashboard(await response.json());
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't load your home overview right now."));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const overviewStats = useMemo(() => ([
        { label: "Support Topics", value: topics.length, detail: "Guided areas ready", tone: "calm" },
        { label: "Wellbeing Score", value: `${dashboard?.wellbeingScore ?? 0}/5`, detail: "Recent baseline", tone: "sky" },
        { label: "Recommendations Done", value: dashboard?.doneCount ?? 0, detail: "Support actions completed", tone: "mint" },
        { label: "Recent Entries", value: dashboard?.recentMoods?.length ?? 0, detail: "Mood snapshots recorded", tone: "sand" },
    ]), [dashboard, topics.length]);

    const recommendations = dashboard?.recommendations || [];
    const recentMoods = dashboard?.recentMoods || [];

    return (
        <section className="home-dashboard-shell">
            <section className="hero-panel home-hero-panel">
                <div>
                    <p className="eyebrow">Home Dashboard</p>
                    <h2 className="hero-title home-dashboard-title">See your support space at a glance and choose your next step.</h2>
                    <p className="hero-copy">
                        Welcome back, {currentUser?.name || "there"}. This is your overview of guided support, daily check-ins, and recommendation progress.
                    </p>
                </div>

                <div className="hero-stats home-dashboard-stats">
                    {overviewStats.map((item) => (
                        <div key={item.label} className={`hero-stat-card home-stat-card home-stat-${item.tone}`}>
                            <span className="hero-stat-label">{item.label}</span>
                            <strong>{item.value}</strong>
                            <small className="home-stat-detail">{item.detail}</small>
                        </div>
                    ))}
                </div>
            </section>

            {loading ? (
                <StatusPanel
                    tone="neutral"
                    title="Preparing your dashboard"
                    message="Pulling together your recent check-ins and recommendation progress."
                />
            ) : error ? (
                <StatusPanel
                    tone="error"
                    title="Your home dashboard is unavailable"
                    message={error}
                    action={{ label: "Try again", onClick: loadDashboard }}
                />
            ) : (
                <div className="home-dashboard-grid">
                    <div className="home-dashboard-main">
                        <div className="home-summary-card">
                            <div className="dashboard-surface-head home-surface-head">
                                <div>
                                    <span className="checkin-kicker">Recent Pattern</span>
                                    <h3>Your latest check-ins, summarized</h3>
                                </div>
                                <p>A quick preview of how the last few days have been feeling.</p>
                            </div>

                            <div className="home-summary-top">
                                <div className="home-pattern-copy">
                                    <strong>
                                        {recentMoods.length
                                            ? `Latest mood: ${recentMoods[0].mood}`
                                            : "No check-ins yet"}
                                    </strong>
                                    <p>
                                        {recentMoods.length
                                            ? `Average stress is ${dashboard.avgStress}/5 across your recent check-ins. Energy is ${dashboard.avgEnergy}/5 and sleep is ${dashboard.avgSleep}/5, so the chart shows where stress has been rising or easing.`
                                            : "Start with a daily check-in to unlock trend previews and recommendation matching."}
                                    </p>
                                </div>
                                <DashboardMiniChart entries={recentMoods.slice(0, 5)} />
                            </div>
                        </div>

                        <div className="home-actions-grid">
                            <QuickActionCard
                                eyebrow="Guided Support"
                                title="Start or continue a topic"
                                text="Move through the support flow and get a summary with follow-up chat."
                                actionLabel="Open Guided Support"
                                onClick={onOpenSupport}
                            />
                            <QuickActionCard
                                eyebrow="Daily Check-In"
                                title="Log how today feels"
                                text="Capture mood, energy, sleep, and notes to keep your pattern clear."
                                actionLabel="Open Daily Check-In"
                                onClick={onOpenCheckIn}
                            />
                            <QuickActionCard
                                eyebrow="Recommendations"
                                title="Review tailored next steps"
                                text="See matched suggestions and track what you complete."
                                actionLabel="Open Recommendations"
                                onClick={onOpenRecommendations}
                            />
                        </div>
                    </div>

                    <div className="home-dashboard-side">
                        <div className="home-recommendation-preview">
                            <div className="dashboard-surface-head home-surface-head">
                                <div>
                                    <span className="checkin-kicker">Support Preview</span>
                                    <h3>What is ready for you now</h3>
                                </div>
                                <p>A snapshot of the next actions already available in your space.</p>
                            </div>

                            {recommendations.length === 0 ? (
                                <StatusPanel
                                    tone="warning"
                                    title="Recommendations will appear here"
                                    message="A few check-ins are enough to start matching more targeted support suggestions."
                                />
                            ) : (
                                <div className="home-preview-list">
                                    {recommendations.slice(0, 3).map((recommendation) => (
                                        <article key={recommendation.id} className="home-preview-item">
                                            <span className="recommendation-type-chip">{recommendation.type}</span>
                                            <strong>{recommendation.title}</strong>
                                            <p>{recommendation.description}</p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
