import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8080";

export default function App() {
    // user id (dynamic)
    const [userId, setUserId] = useState(() => localStorage.getItem("tg_userId") || "");
    const [userIdDraft, setUserIdDraft] = useState(userId);

    // data
    const [topics, setTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(true);

    // session state
    const [sessionId, setSessionId] = useState(null);
    const [question, setQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(""); // for MCQ/YES_NO
    const [textAnswer, setTextAnswer] = useState(""); // for TEXT
    const [scaleAnswer, setScaleAnswer] = useState(3); // for SCALE

    // final result
    const [finalResult, setFinalResult] = useState(null);

    // ui state
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Load topics on start
    useEffect(() => {
        (async () => {
            try {
                setLoadingTopics(true);
                setError("");
                const res = await fetch(`${API_BASE}/topics`);
                if (!res.ok) throw new Error(`Failed to load topics (${res.status})`);
                const data = await res.json();
                setTopics(data);
            } catch (e) {
                setError(e.message || "Failed to load topics");
            } finally {
                setLoadingTopics(false);
            }
        })();
    }, []);

    // Try to parse optionsJson safely
    const parsedOptions = useMemo(() => {
        if (!question?.optionsJson) return null;
        try {
            return JSON.parse(question.optionsJson);
        } catch {
            return null;
        }
    }, [question]);

    const totalStepsForCurrentTopic = useMemo(() => {
        if (!question) return null;
        const t = topics.find((x) => x.id === question.topicId);
        // if backend provides this, great:
        if (t && typeof t.totalSteps === "number") return t.totalSteps;
        // fallback unknown:
        return null;
    }, [question, topics]);

    const progressPct = useMemo(() => {
        if (!question) return 0;
        if (!totalStepsForCurrentTopic) return 0;
        return Math.min(100, Math.round((question.stepNo / totalStepsForCurrentTopic) * 100));
    }, [question, totalStepsForCurrentTopic]);

    const saveUserId = () => {
        const v = userIdDraft.trim();
        if (!v) {
            setError("Please enter a User ID (anything like user-001).");
            return;
        }
        setError("");
        setUserId(v);
        localStorage.setItem("tg_userId", v);
    };

    const startSession = async (topicId) => {
        try {
            setBusy(true);
            setError("");
            setFinalResult(null);

            const uid = userId.trim();
            if (!uid) {
                setError("Set a User ID first.");
                return;
            }

            const res = await fetch(`${API_BASE}/topics/${topicId}/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: uid }),
            });
            if (!res.ok) throw new Error(`Start failed (${res.status})`);

            const data = await res.json();
            setSessionId(data.sessionId);
            setQuestion(data.firstQuestion);

            // reset inputs
            setSelectedAnswer("");
            setTextAnswer("");
            setScaleAnswer(3);
        } catch (e) {
            setError(e.message || "Failed to start session");
        } finally {
            setBusy(false);
        }
    };

    const submitAnswer = async () => {
        if (!sessionId || !question) return;

        // pick correct payload by question type
        let answerValue = "";
        if (question.type === "MCQ" || question.type === "YES_NO") {
            answerValue = selectedAnswer;
        } else if (question.type === "TEXT") {
            answerValue = textAnswer.trim();
        } else if (question.type === "SCALE") {
            answerValue = String(scaleAnswer);
        }

        if (!answerValue) {
            setError("Please select/enter an answer first.");
            return;
        }

        try {
            setBusy(true);
            setError("");

            const res = await fetch(`${API_BASE}/sessions/${sessionId}/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: question.questionId,
                    answerValue,
                }),
            });
            if (!res.ok) throw new Error(`Answer failed (${res.status})`);

            const data = await res.json();

            // reset input for next
            setSelectedAnswer("");
            setTextAnswer("");
            setScaleAnswer(3);

            if (data.finalResult) {
                setFinalResult(data.finalResult);
                setQuestion(null);
                setSessionId(null);
            } else if (data.nextQuestion) {
                setQuestion(data.nextQuestion);
            } else {
                // If backend ends without finalResult
                setFinalResult({ summary: "Session completed.", recommendations: [] });
                setQuestion(null);
                setSessionId(null);
            }
        } catch (e) {
            setError(e.message || "Failed to submit answer");
        } finally {
            setBusy(false);
        }
    };

    const resetAll = () => {
        setSessionId(null);
        setQuestion(null);
        setFinalResult(null);
        setSelectedAnswer("");
        setTextAnswer("");
        setScaleAnswer(3);
        setError("");
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Topic Guidance</h1>
                        <p style={styles.subTitle}>Guided conversations • step-by-step • stored in MySQL</p>
                    </div>

                    <div style={styles.userBox}>
                        <input
                            style={styles.input}
                            placeholder="User ID (e.g., user-001)"
                            value={userIdDraft}
                            onChange={(e) => setUserIdDraft(e.target.value)}
                        />
                        <button style={styles.btn} onClick={saveUserId} disabled={busy}>
                            Save
                        </button>
                    </div>
                </header>

                {error && <div style={styles.error}>{error}</div>}

                {/* If currently answering a question */}
                {question && (
                    <div style={styles.card}>
                        <div style={styles.cardTop}>
                            <div>
                                <div style={styles.badge}>{question.topicId}</div>
                                <h2 style={styles.cardTitle}>{question.text}</h2>
                            </div>

                            <button style={styles.btnGhost} onClick={resetAll} disabled={busy}>
                                Exit
                            </button>
                        </div>

                        {/* Progress */}
                        <div style={{ marginTop: 16 }}>
                            <div style={styles.progressRow}>
                <span style={styles.muted}>
                  Step <b>{question.stepNo}</b>
                    {totalStepsForCurrentTopic ? (
                        <>
                            {" "}
                            / <b>{totalStepsForCurrentTopic}</b>
                        </>
                    ) : null}
                </span>
                                {totalStepsForCurrentTopic ? <span style={styles.muted}>{progressPct}%</span> : null}
                            </div>
                            <div style={styles.progressBar}>
                                <div
                                    style={{
                                        ...styles.progressFill,
                                        width: totalStepsForCurrentTopic ? `${progressPct}%` : "20%",
                                        opacity: totalStepsForCurrentTopic ? 1 : 0.5,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Render input by type */}
                        <div style={{ marginTop: 18 }}>
                            {(question.type === "MCQ" || question.type === "YES_NO") && Array.isArray(parsedOptions) && (
                                <div style={styles.optionGrid}>
                                    {parsedOptions.map((opt) => {
                                        const active = selectedAnswer === opt;
                                        return (
                                            <button
                                                key={opt}
                                                style={{ ...styles.optionBtn, ...(active ? styles.optionBtnActive : {}) }}
                                                onClick={() => setSelectedAnswer(opt)}
                                                disabled={busy}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {question.type === "TEXT" && (
                                <textarea
                                    style={styles.textarea}
                                    rows={4}
                                    value={textAnswer}
                                    onChange={(e) => setTextAnswer(e.target.value)}
                                    placeholder="Type your answer..."
                                    disabled={busy}
                                />
                            )}

                            {question.type === "SCALE" && parsedOptions && typeof parsedOptions === "object" && (
                                <div style={{ marginTop: 6 }}>
                                    <div style={styles.scaleRow}>
                                        <span style={styles.muted}>Low</span>
                                        <span style={{ fontWeight: 800, fontSize: 20 }}>{scaleAnswer}</span>
                                        <span style={styles.muted}>High</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={parsedOptions.min ?? 1}
                                        max={parsedOptions.max ?? 5}
                                        value={scaleAnswer}
                                        onChange={(e) => setScaleAnswer(Number(e.target.value))}
                                        style={styles.slider}
                                        disabled={busy}
                                    />
                                </div>
                            )}

                            {/* fallback if optionsJson is missing/invalid */}
                            {(question.type === "MCQ" || question.type === "YES_NO") && !Array.isArray(parsedOptions) && (
                                <input
                                    style={styles.inputWide}
                                    placeholder="Type your answer..."
                                    value={selectedAnswer}
                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                    disabled={busy}
                                />
                            )}
                        </div>

                        <div style={styles.cardActions}>
                            <button style={styles.btnPrimary} onClick={submitAnswer} disabled={busy}>
                                {busy ? "Sending..." : "Next"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Final Result */}
                {finalResult && (
                    <div style={styles.card}>
                        <div style={styles.cardTop}>
                            <div>
                                <div style={styles.badge}>RESULT</div>
                                <h2 style={styles.cardTitle}>Your Guidance Summary</h2>
                            </div>
                            <button style={styles.btnGhost} onClick={resetAll}>
                                New Session
                            </button>
                        </div>

                        {finalResult.summary && <p style={{ marginTop: 10, lineHeight: 1.6 }}>{finalResult.summary}</p>}

                        {finalResult.impactLevel && (
                            <div style={{ marginTop: 10 }}>
                                <span style={styles.muted}>Impact Level: </span>
                                <b>{finalResult.impactLevel}</b>
                            </div>
                        )}

                        {Array.isArray(finalResult.recommendations) && finalResult.recommendations.length > 0 && (
                            <div style={{ marginTop: 14 }}>
                                <h3 style={{ marginBottom: 8 }}>Recommendations</h3>
                                <ul style={{ marginTop: 0 }}>
                                    {finalResult.recommendations.map((r, idx) => (
                                        <li key={idx} style={{ marginBottom: 6 }}>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Topics list (home) */}
                {!question && !finalResult && (
                    <div style={styles.card}>
                        <div style={styles.cardTop}>
                            <div>
                                <div style={styles.badge}>TOPICS</div>
                                <h2 style={styles.cardTitle}>Choose a topic to begin</h2>
                            </div>
                        </div>

                        {loadingTopics ? (
                            <p style={styles.muted}>Loading topics…</p>
                        ) : (
                            <div style={styles.topicList}>
                                {topics.map((t) => (
                                    <div key={t.id} style={styles.topicItem}>
                                        <div>
                                            <div style={styles.topicName}>{t.name}</div>
                                            <div style={styles.topicDesc}>{t.description}</div>
                                            <div style={styles.topicId}>{t.id}</div>
                                        </div>
                                        <button style={styles.btnPrimary} onClick={() => startSession(t.id)} disabled={busy || !userId}>
                                            Start
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <footer style={styles.footer}>
                    <span style={styles.muted}>Backend: {API_BASE} • Frontend: Vite</span>
                </footer>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#0b0c10",
        color: "#eaeaea",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        padding: 24,
    },
    container: { maxWidth: 1200, margin: "0 auto" },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: 18,
    },
    title: { margin: 0, fontSize: 44, letterSpacing: -1 },
    subTitle: { margin: "6px 0 0", opacity: 0.75 },
    userBox: { display: "flex", gap: 10, alignItems: "center" },

    card: {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    cardTitle: { margin: "8px 0 0", fontSize: 22 },

    badge: {
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        letterSpacing: 0.6,
        background: "rgba(120, 120, 255, 0.18)",
        border: "1px solid rgba(120, 120, 255, 0.35)",
    },

    input: {
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 10,
        outline: "none",
        width: 220,
    },
    inputWide: {
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
        padding: "12px 12px",
        borderRadius: 10,
        outline: "none",
        width: "100%",
    },
    textarea: {
        width: "100%",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
        padding: "12px 12px",
        borderRadius: 10,
        outline: "none",
        resize: "vertical",
    },

    btn: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        cursor: "pointer",
    },
    btnPrimary: {
        background: "linear-gradient(135deg, rgba(132,94,247,1), rgba(66,193,255,1))",
        border: "none",
        color: "#0b0c10",
        padding: "10px 14px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 800,
    },
    btnGhost: {
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: 10,
        cursor: "pointer",
    },

    optionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 },
    optionBtn: {
        textAlign: "left",
        padding: "12px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
        cursor: "pointer",
    },
    optionBtnActive: {
        border: "1px solid rgba(66,193,255,0.65)",
        background: "rgba(66,193,255,0.14)",
    },

    scaleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    slider: { width: "100%" },

    cardActions: { marginTop: 16, display: "flex", justifyContent: "flex-end" },

    progressRow: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
    progressBar: {
        width: "100%",
        height: 10,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 999,
        background: "linear-gradient(135deg, rgba(132,94,247,1), rgba(66,193,255,1))",
    },

    topicList: { display: "grid", gap: 12, marginTop: 10 },
    topicItem: {
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        alignItems: "center",
    },
    topicName: { fontSize: 18, fontWeight: 800 },
    topicDesc: { opacity: 0.8, marginTop: 4 },
    topicId: { opacity: 0.6, marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace" },

    muted: { opacity: 0.75 },
    error: {
        marginBottom: 14,
        padding: 12,
        borderRadius: 12,
        background: "rgba(255, 60, 60, 0.12)",
        border: "1px solid rgba(255, 60, 60, 0.25)",
    },
    footer: { marginTop: 16, textAlign: "center" },
};