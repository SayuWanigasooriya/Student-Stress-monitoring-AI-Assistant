import { useCallback, useEffect, useMemo, useState } from "react";
import StatusPanel from "./StatusPanel";
import { styles } from "../styles";
import { API_BASE, getFriendlyMessage } from "../utils/appHelpers";

const moodOptions = [
    { value: "Calm", accent: "#61b89d", icon: "○", description: "Steady, clearer, and more settled." },
    { value: "Okay", accent: "#6f97bb", icon: "◔", description: "Holding things together without much strain." },
    { value: "Stressed", accent: "#e0a257", icon: "◑", description: "Pressure is noticeable and taking space." },
    { value: "Tired", accent: "#8d9bac", icon: "◕", description: "Energy feels lower than you want." },
    { value: "Overwhelmed", accent: "#d37b67", icon: "●", description: "Too much is landing at once right now." },
];

const scoreConfig = [
    { key: "stressLevel", title: "Stress", low: "Light", high: "Heavy", tint: "var(--checkin-sand)" },
    { key: "energyLevel", title: "Energy", low: "Drained", high: "Full", tint: "var(--checkin-mint)" },
    { key: "sleepQuality", title: "Sleep", low: "Broken", high: "Restful", tint: "var(--checkin-sky)" },
];

function averageFrom(entries, key) {
    if (!entries.length) return "0.0";
    const total = entries.reduce((sum, entry) => sum + Number(entry[key] || 0), 0);
    return (total / entries.length).toFixed(1);
}

function formatEntryDate(value) {
    if (!value) return "Just now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function getToneSummary(mood, entries) {
    if (!entries.length) {
        return "Start with one honest check-in and let the pattern build from there.";
    }

    if (mood === "Overwhelmed" || mood === "Stressed") {
        return "Today looks heavier. Keep the next step smaller than your stress wants it to be.";
    }

    if (mood === "Tired") {
        return "Lower energy showed up in your recent pattern. Protect recovery where you can.";
    }

    if (mood === "Calm") {
        return "There is some steadiness here. This is a good day to reinforce what is already helping.";
    }

    return "Your recent pattern looks mixed, which is normal. Consistency matters more than perfection.";
}

function getRecentEntries(entries, limit = 7) {
    return [...entries].slice(0, limit).reverse();
}

function createLinePoints(values, width, height) {
    if (!values.length) return "";

    const xStep = values.length > 1 ? width / (values.length - 1) : width / 2;
    return values.map((value, index) => {
        const x = values.length > 1 ? index * xStep : width / 2;
        const y = height - ((value - 1) / 4) * height;
        return `${x},${y}`;
    }).join(" ");
}

function summarizeMoodFrequency(entries) {
    return moodOptions
        .map((option) => ({
            ...option,
            count: entries.filter((entry) => entry.mood === option.value).length,
        }))
        .filter((item) => item.count > 0)
        .sort((left, right) => right.count - left.count);
}

function SparklineCard({ title, detail, values, accent }) {
    const width = 240;
    const height = 72;
    const points = createLinePoints(values, width, height);

    return (
        <article className="trend-card">
            <div className="trend-card-head">
                <div>
                    <span className="checkin-kicker">{title}</span>
                    <h4>{detail}</h4>
                </div>
                <strong>{values.length ? `${values[values.length - 1]}/5` : "--"}</strong>
            </div>

            {values.length ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="trend-sparkline" role="img" aria-label={`${title} trend`}>
                    <polyline
                        fill="none"
                        stroke={accent}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                    />
                    {values.map((value, index) => {
                        const pointList = points.split(" ");
                        const [cx, cy] = pointList[index].split(",");
                        return <circle key={`${title}-${index}`} cx={cx} cy={cy} r="4.5" fill={accent} />;
                    })}
                </svg>
            ) : (
                <div className="trend-chart-empty">No data yet</div>
            )}
        </article>
    );
}

function MetricBand({ title, average, latest, accent }) {
    return (
        <article className="metric-band-card">
            <div className="metric-band-copy">
                <span className="checkin-kicker">{title}</span>
                <strong>{average}/5 average</strong>
                <small>Latest: {latest ? `${latest}/5` : "--"}</small>
            </div>
            <div className="metric-band-track">
                <span className="metric-band-fill" style={{ width: `${(Number(average) / 5) * 100}%`, background: accent }} />
            </div>
        </article>
    );
}

function WeeklyTrendPanel({ entries, loading, error, onRetry }) {
    const recentEntries = useMemo(() => getRecentEntries(entries), [entries]);
    const moodFrequency = useMemo(() => summarizeMoodFrequency(recentEntries), [recentEntries]);
    const stressValues = useMemo(() => recentEntries.map((entry) => Number(entry.stressLevel || 0)), [recentEntries]);
    const energyValues = useMemo(() => recentEntries.map((entry) => Number(entry.energyLevel || 0)), [recentEntries]);
    const sleepValues = useMemo(() => recentEntries.map((entry) => Number(entry.sleepQuality || 0)), [recentEntries]);

    return (
        <div className="checkin-surface">
            <div className="checkin-surface-head">
                <div>
                    <span className="checkin-kicker">Weekly Trends</span>
                    <h3>See what the last few check-ins are saying</h3>
                </div>
                <p>Short visual cues make it easier to spot pressure, recovery, and the moods repeating most.</p>
            </div>

            {loading ? (
                <StatusPanel
                    tone="neutral"
                    title="Building your trend snapshot"
                    message="Pulling together the latest check-ins into a clearer weekly read."
                />
            ) : error ? (
                <StatusPanel
                    tone="error"
                    title="The weekly chart could not load"
                    message={error}
                    action={{ label: "Try again", onClick: onRetry }}
                />
            ) : recentEntries.length === 0 ? (
                <StatusPanel
                    tone="warning"
                    title="Your weekly trends will appear here"
                    message="Save a few check-ins and this section will turn them into simple visual patterns."
                />
            ) : (
                <div className="trend-grid">
                    <SparklineCard
                        title="Stress Trend"
                        detail="How pressure has shifted across recent check-ins"
                        values={stressValues}
                        accent="#d29c5e"
                    />
                    <div className="trend-card trend-stack-card">
                        <div className="trend-card-head">
                            <div>
                                <span className="checkin-kicker">Energy + Sleep</span>
                                <h4>Your recovery signals at a glance</h4>
                            </div>
                        </div>
                        <div className="metric-band-grid">
                            <MetricBand
                                title="Energy"
                                average={averageFrom(recentEntries, "energyLevel")}
                                latest={recentEntries[recentEntries.length - 1]?.energyLevel}
                                accent="linear-gradient(90deg, #8fd1bc, #61b89d)"
                            />
                            <MetricBand
                                title="Sleep"
                                average={averageFrom(recentEntries, "sleepQuality")}
                                latest={recentEntries[recentEntries.length - 1]?.sleepQuality}
                                accent="linear-gradient(90deg, #aac9de, #6f97bb)"
                            />
                        </div>
                        <div className="trend-inline-metrics">
                            <span>Energy {energyValues[energyValues.length - 1] || "--"}/5</span>
                            <span>Sleep {sleepValues[sleepValues.length - 1] || "--"}/5</span>
                        </div>
                    </div>

                    <div className="trend-card trend-wide-card">
                        <div className="trend-card-head">
                            <div>
                                <span className="checkin-kicker">Mood Frequency</span>
                                <h4>What has been showing up most often</h4>
                            </div>
                            <strong>{recentEntries.length} entries</strong>
                        </div>
                        <div className="mood-frequency-row">
                            {moodFrequency.map((item) => (
                                <span
                                    key={item.value}
                                    className="mood-frequency-chip"
                                    style={{ "--mood-accent": item.accent }}
                                >
                                    <span aria-hidden="true">{item.icon}</span>
                                    {item.value}
                                    <strong>{item.count}</strong>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DailyCheckInScreen({ currentUser }) {
    const [entries, setEntries] = useState([]);
    const [insights, setInsights] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [entriesError, setEntriesError] = useState("");
    const [insightsError, setInsightsError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState({
        mood: "Okay",
        stressLevel: 3,
        energyLevel: 3,
        sleepQuality: 3,
        notes: "",
    });

    const userId = currentUser?.id;

    const loadEntries = useCallback(async () => {
        if (!userId) return;
        try {
            setLoadingEntries(true);
            setEntriesError("");
            const response = await fetch(`${API_BASE}/api/mood-entries?userId=${userId}`);
            if (!response.ok) {
                throw new Error("We couldn't load your daily check-ins right now.");
            }
            const data = await response.json();
            setEntries(Array.isArray(data) ? data : []);
        } catch (e) {
            setEntriesError(getFriendlyMessage(e, "We couldn't load your daily check-ins right now."));
        } finally {
            setLoadingEntries(false);
        }
    }, [userId]);

    const loadInsights = useCallback(async () => {
        if (!userId) return;
        try {
            setLoadingInsights(true);
            setInsightsError("");
            const response = await fetch(`${API_BASE}/api/ai-insights?userId=${userId}`);
            if (!response.ok) {
                throw new Error("We couldn't load your AI insights right now.");
            }
            setInsights(await response.json());
        } catch (e) {
            setInsightsError(getFriendlyMessage(e, "We couldn't load your AI insights right now."));
        } finally {
            setLoadingInsights(false);
        }
    }, [userId]);

    useEffect(() => {
        setSubmitError("");
        setSuccess("");
        loadEntries();
        loadInsights();
    }, [loadEntries, loadInsights]);

    const stats = useMemo(() => ([
        { label: "Total Entries", value: entries.length, detail: "Moments logged" },
        { label: "Stress Trend", value: averageFrom(entries, "stressLevel"), detail: "Average this period" },
        { label: "Energy Trend", value: averageFrom(entries, "energyLevel"), detail: "Average this period" },
        { label: "Sleep Trend", value: averageFrom(entries, "sleepQuality"), detail: "Average this period" },
    ]), [entries]);

    const latestEntry = entries[0];
    const selectedMood = moodOptions.find((option) => option.value === form.mood) || moodOptions[1];
    const toneSummary = useMemo(
        () => getToneSummary(latestEntry?.mood || form.mood, entries),
        [entries, form.mood, latestEntry?.mood]
    );

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!userId || submitting) return;

        try {
            setSubmitting(true);
            setSubmitError("");
            setSuccess("");

            const response = await fetch(`${API_BASE}/api/mood-entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    ...form,
                    notes: form.notes.trim(),
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.message || "We couldn't save your daily check-in right now.");
            }

            setForm((current) => ({
                ...current,
                stressLevel: 3,
                energyLevel: 3,
                sleepQuality: 3,
                notes: "",
            }));
            setSuccess("Your daily check-in has been saved.");
            await Promise.all([loadEntries(), loadInsights()]);
        } catch (e) {
            setSubmitError(getFriendlyMessage(e, "We couldn't save your daily check-in right now."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="checkin-shell">
            <section className="hero-panel checkin-hero-soft">
                <div className="checkin-hero-copy">
                    <span style={styles.badge}>Daily Check-In</span>
                    <h2 className="checkin-hero-title">A calmer way to track how your day is actually feeling.</h2>
                    <p className="checkin-hero-text">
                        Log one honest snapshot for {currentUser?.name || "your account"}, then let the app surface patterns, tension points, and small next steps.
                    </p>
                </div>

                <div className="hero-stats checkin-hero-stats">
                    <div className="hero-stat-card checkin-tone-card">
                        <span className="hero-stat-label">Current Tone</span>
                        <strong style={{ color: selectedMood.accent }}>{latestEntry?.mood || form.mood}</strong>
                        <p>{toneSummary}</p>
                    </div>
                    {stats.map((item) => (
                        <div key={item.label} className="hero-stat-card checkin-hero-stat-card">
                            <span className="hero-stat-label">{item.label}</span>
                            <strong>
                                {item.value}
                                {item.label === "Total Entries" ? "" : "/5"}
                            </strong>
                            <small>{item.detail}</small>
                        </div>
                    ))}
                </div>
            </section>

            {submitError ? (
                <StatusPanel tone="error" title="This check-in did not save" message={submitError} />
            ) : null}
            {success ? <div style={styles.success}>{success}</div> : null}

            <div className="daily-checkin-grid">
                <div className="checkin-main-stack">
                    <form onSubmit={handleSubmit} className="checkin-surface checkin-form-surface">
                        <div className="checkin-surface-head">
                            <div>
                                <span className="checkin-kicker">Reflection</span>
                                <h3>Log today’s emotional snapshot</h3>
                            </div>
                            <p>Pick the mood that feels closest, then tune the sliders to match the day.</p>
                        </div>

                        <div className="checkin-mood-grid">
                            {moodOptions.map((option) => {
                                const isActive = form.mood === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`checkin-mood-card${isActive ? " is-active" : ""}`}
                                        style={{ "--mood-accent": option.accent }}
                                        onClick={() => setForm((current) => ({ ...current, mood: option.value }))}
                                    >
                                        <span className="checkin-mood-icon" aria-hidden="true">{option.icon}</span>
                                        <strong>{option.value}</strong>
                                        <p>{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="checkin-slider-grid">
                            {scoreConfig.map((item) => (
                                <label key={item.key} className="checkin-slider-card" style={{ "--slider-tint": item.tint }}>
                                    <div className="checkin-slider-head">
                                        <span>{item.title}</span>
                                        <strong>{form[item.key]} / 5</strong>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={form[item.key]}
                                        onChange={(event) => setForm((current) => ({
                                            ...current,
                                            [item.key]: Number(event.target.value),
                                        }))}
                                    />
                                    <div className="checkin-slider-scale">
                                        <span>{item.low}</span>
                                        <span>{item.high}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <label className="checkin-notes-block">
                            <span className="checkin-kicker">Notes</span>
                            <textarea
                                style={styles.textarea}
                                rows="5"
                                placeholder="What felt heavy, what helped, or what you want to remember from today."
                                value={form.notes}
                                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                            />
                        </label>

                        <div className="checkin-form-footer">
                            <p>Your entries stay simple on purpose: one honest minute is enough.</p>
                            <button type="submit" style={styles.btnPrimary} className="primary-button" disabled={submitting}>
                                {submitting ? "Saving..." : "Save Check-In"}
                            </button>
                        </div>
                    </form>

                    <WeeklyTrendPanel
                        entries={entries}
                        loading={loadingEntries}
                        error={entriesError}
                        onRetry={loadEntries}
                    />

                    <div className="checkin-surface">
                        <div className="checkin-surface-head">
                            <div>
                                <span className="checkin-kicker">Recent Entries</span>
                                <h3>Your latest check-ins</h3>
                            </div>
                            <p>Quick history so you can notice shifts without digging.</p>
                        </div>

                        {loadingEntries ? (
                            <StatusPanel
                                tone="neutral"
                                title="Loading your recent entries"
                                message="Pulling in the latest snapshots so you can review them without digging."
                            />
                        ) : entriesError ? (
                            <StatusPanel
                                tone="error"
                                title="Your entry history is unavailable"
                                message={entriesError}
                                action={{ label: "Reload entries", onClick: loadEntries }}
                            />
                        ) : entries.length === 0 ? (
                            <StatusPanel
                                tone="warning"
                                title="No entries yet"
                                message="Your first check-in will start building the history and weekly pattern here."
                            />
                        ) : (
                            <div className="entry-list">
                                {entries.slice(0, 6).map((entry) => (
                                    <article key={entry.id} className="entry-card">
                                        <div className="entry-card-top">
                                            <div>
                                                <strong>{entry.mood}</strong>
                                                <span>{formatEntryDate(entry.date)}</span>
                                            </div>
                                            <div className="entry-rating-pill">
                                                {entry.stressLevel}/{entry.energyLevel}/{entry.sleepQuality}
                                            </div>
                                        </div>
                                        <div className="entry-measure-row">
                                            <span>Stress {entry.stressLevel}/5</span>
                                            <span>Energy {entry.energyLevel}/5</span>
                                            <span>Sleep {entry.sleepQuality}/5</span>
                                        </div>
                                        {entry.notes ? <p className="entry-note">{entry.notes}</p> : null}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="daily-checkin-side">
                    <div className="checkin-surface checkin-insights-surface">
                        <div className="checkin-surface-head">
                            <div>
                                <span className="checkin-kicker">AI Insights</span>
                                <h3>Patterns from your check-ins</h3>
                            </div>
                            <p>Short observations and next steps based on what you have logged.</p>
                        </div>

                        {loadingInsights ? (
                            <StatusPanel
                                tone="neutral"
                                title="Reading your recent pattern"
                                message="The assistant is pulling together the latest summary and next-step ideas."
                            />
                        ) : insightsError ? (
                            <StatusPanel
                                tone="error"
                                title="Your insights are unavailable"
                                message={insightsError}
                                action={{ label: "Reload insights", onClick: loadInsights }}
                            />
                        ) : !insights?.summary?.text && !(insights?.insights || []).length ? (
                            <StatusPanel
                                tone="warning"
                                title="Insights will get sharper with more check-ins"
                                message="Keep logging a few honest snapshots and the assistant will start surfacing stronger patterns here."
                            />
                        ) : (
                            <>
                                <div className="checkin-summary-box">
                                    <strong>Weekly read</strong>
                                    <p>{insights?.summary?.text || "Your insights will appear here after a few check-ins."}</p>
                                </div>

                                <div className="insight-list">
                                    {(insights?.insights || []).map((item, index) => (
                                        <article key={`${item.title}-${index}`} className="insight-card">
                                            <span className="insight-accent" style={{ background: item.color || "var(--checkin-sky)" }} />
                                            <div>
                                                <strong>{item.title}</strong>
                                                <p>{item.message}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <div className="insight-chip-row">
                                    {(insights?.summary?.highlights || []).map((item, index) => (
                                        <span key={`${item.text}-${index}`} className="insight-chip">{item.text}</span>
                                    ))}
                                </div>

                                {(insights?.affirmations || []).length ? (
                                    <div className="mini-list-block">
                                        <h4>Affirmations</h4>
                                        <ul>
                                            {(insights?.affirmations || []).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                                        </ul>
                                    </div>
                                ) : null}

                                {(insights?.suggestions || []).length ? (
                                    <div className="mini-list-block">
                                        <h4>Suggested next steps</h4>
                                        <ul>
                                            {(insights?.suggestions || []).map((item, index) => (
                                                <li key={`${item.title}-${index}`}>
                                                    <strong>{item.title}</strong>: {item.description} ({item.duration})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
