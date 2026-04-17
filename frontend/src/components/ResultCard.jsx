import { styles } from "../styles";
import { useEffect, useRef } from "react";
import StatusPanel from "./StatusPanel";

function ChatSection({
    chatMessages,
    chatInput,
    setChatInput,
    sendChatMessage,
    chatSending,
}) {
    const messagesRef = useRef(null);

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [chatMessages, chatSending]);

    return (
        <div style={styles.chatBox} className="chat-shell">
            <h3 style={{ marginTop: 0 }}>Support Chat</h3>
            <p style={styles.muted}>Keep the conversation going here.</p>

            <div style={styles.chatMessages} className="chat-messages" ref={messagesRef}>
                {chatMessages.map((msg, index) => (
                    <div
                        key={`${msg.sender}-${index}`}
                        style={msg.sender === "user" ? styles.userBubble : styles.botBubble}
                        className={msg.sender === "user" ? "chat-bubble-user" : "chat-bubble-bot"}
                    >
                        {msg.message}
                        {msg.sender === "bot" && msg.source ? (
                            <div className="chat-source-label">
                                {msg.source === "gemini"
                                    ? "Source: Gemini"
                                    : msg.source === "fallback"
                                        ? "Source: Fallback"
                                        : "Source: System"}
                                {msg.source === "fallback" && msg.fallbackReason ? ` (${msg.fallbackReason})` : ""}
                            </div>
                        ) : null}
                    </div>
                ))}
                {chatSending && (
                    <div style={styles.botBubble} className="chat-bubble-bot chat-typing">
                        Thinking it through...
                    </div>
                )}
            </div>

            <div style={styles.chatInputRow}>
                <input
                    style={styles.inputWide}
                    className="field-input"
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !chatSending) sendChatMessage();
                    }}
                    disabled={chatSending}
                />
                <button style={styles.btnPrimary} className="primary-button" onClick={sendChatMessage} disabled={chatSending}>
                    {chatSending ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    );
}

export default function ResultCard({
    finalResult,
    showChat,
    openChat,
    resetAll,
    chatMessages,
    chatInput,
    setChatInput,
    sendChatMessage,
    chatSending,
}) {
    const impactTone = String(finalResult.impactLevel || "").toUpperCase();
    const impactClassName =
        impactTone === "HIGH" ? "impact-chip impact-high" :
            impactTone === "MEDIUM" ? "impact-chip impact-medium" :
                "impact-chip impact-low";

    return (
        <div style={styles.card} className="panel-card">
            <div style={styles.cardTop} className="panel-card-top">
                <div>
                    <div style={styles.badge}>RESULT</div>
                    <h2 style={styles.cardTitle}>Your Support Summary</h2>
                </div>

                <div style={styles.topButtonGroup}>
                    <button style={styles.btnGhost} className="ghost-button" onClick={openChat}>
                        Open Support Chat
                    </button>
                    <button style={styles.btnGhost} className="ghost-button" onClick={resetAll}>
                        Choose Another Topic
                    </button>
                </div>
            </div>

            {finalResult.summary && <p style={{ marginTop: 10, lineHeight: 1.6 }}>{finalResult.summary}</p>}

            {finalResult.impactLevel && (
                <div style={{ marginTop: 10 }} className="result-meta">
                    <span style={styles.muted}>Support Level</span>
                    <span className={impactClassName}>{finalResult.impactLevel}</span>
                </div>
            )}

            {Array.isArray(finalResult.recommendations) && finalResult.recommendations.length > 0 ? (
                <div style={{ marginTop: 14 }} className="recommendation-panel">
                    <h3 style={{ marginBottom: 8 }}>Helpful Next Steps</h3>
                    <ul style={{ marginTop: 0 }} className="recommendation-list">
                        {finalResult.recommendations.map((recommendation, index) => (
                            <li key={index} style={{ marginBottom: 6 }}>
                                {recommendation}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div style={{ marginTop: 14 }}>
                    <StatusPanel
                        tone="neutral"
                        title="More guidance can build from here"
                        message="You have your summary already. Open the support chat if you want more tailored next steps."
                    />
                </div>
            )}

            {showChat && (
                <ChatSection
                    chatMessages={chatMessages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    sendChatMessage={sendChatMessage}
                    chatSending={chatSending}
                />
            )}
        </div>
    );
}
