import { styles } from "../styles";

export default function QuestionCard({
    question,
    totalStepsForCurrentTopic,
    progressPct,
    parsedOptions,
    selectedAnswer,
    setSelectedAnswer,
    textAnswer,
    setTextAnswer,
    scaleAnswer,
    setScaleAnswer,
    submitAnswer,
    resetAll,
    busy,
}) {
    return (
        <div style={styles.card} className="panel-card">
            <div style={styles.cardTop} className="panel-card-top">
                <div>
                    <div style={styles.badge}>{question.topicId}</div>
                    <h2 style={styles.cardTitle}>{question.text}</h2>
                    <p className="section-helper">Answer honestly to get a more relevant summary and chat follow-up.</p>
                </div>

                <button style={styles.btnGhost} className="ghost-button" onClick={resetAll} disabled={busy}>
                    Exit
                </button>
            </div>

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

            <div style={{ marginTop: 18 }}>
                {(question.type === "MCQ" || question.type === "YES_NO") && Array.isArray(parsedOptions) && (
                    <div style={styles.optionGrid}>
                        {parsedOptions.map((opt) => {
                            const active = selectedAnswer === opt;
                            return (
                                <button
                                    key={opt}
                                    style={{ ...styles.optionBtn, ...(active ? styles.optionBtnActive : {}) }}
                                    className="option-button"
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
                        className="field-input field-textarea"
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

                {(question.type === "MCQ" || question.type === "YES_NO") && !Array.isArray(parsedOptions) && (
                    <input
                        style={styles.inputWide}
                        className="field-input"
                        placeholder="Type your answer..."
                        value={selectedAnswer}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        disabled={busy}
                    />
                )}
            </div>

            <div style={styles.cardActions}>
                <button style={styles.btnPrimary} className="primary-button" onClick={submitAnswer} disabled={busy}>
                    {busy ? "Sending..." : "Next"}
                </button>
            </div>
        </div>
    );
}
