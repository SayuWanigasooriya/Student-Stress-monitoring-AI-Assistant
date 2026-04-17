import { useEffect, useMemo, useRef, useState } from "react";

import { API_BASE, getFriendlyMessage } from "../utils/appHelpers";

const DEFAULT_QUICK_ACTIONS = [
    { id: "badDay", label: "I had a bad day", message: "I had a bad day." },
    { id: "relaxMind", label: "Relax my mind", message: "I want to relax my mind." },
    { id: "breathing", label: "Breathing exercises", message: "Can you guide me through breathing exercises?" },
    { id: "checkin", label: "Daily check-in", message: "Let's do a quick daily check-in." },
];

function formatTime(ts) {
    try {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

function getGreeting(now = new Date()) {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
}

function formatFullDate(date = new Date()) {
    return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getSessionGroupLabel(ts) {
    const now = new Date();
    const date = new Date(ts);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfLast7Days = new Date(startOfToday);
    startOfLast7Days.setDate(startOfLast7Days.getDate() - 7);
    const startOfLast30Days = new Date(startOfToday);
    startOfLast30Days.setDate(startOfLast30Days.getDate() - 30);

    if (date >= startOfToday) return "Today";
    if (date >= startOfYesterday) return "Yesterday";
    if (date >= startOfLast7Days) return "Last 7 days";
    if (date >= startOfLast30Days) return "Last 30 days";
    return "Older";
}

function createAssistantWelcomeMessage() {
    return {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Hi, I'm here to listen. You can talk freely about what's on your mind. How are you feeling today?",
        ts: Date.now(),
        source: "system",
    };
}

export default function FreeChatScreen() {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [messagesBySession, setMessagesBySession] = useState({});
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState("");
    const [now, setNow] = useState(() => new Date());

    const listRef = useRef(null);
    const inputRef = useRef(null);

    const quickActions = useMemo(() => DEFAULT_QUICK_ACTIONS, []);
    const greeting = useMemo(() => getGreeting(now), [now]);
    const todayFull = useMemo(() => formatFullDate(now), [now]);
    const activeMessages = messagesBySession[activeSessionId] || [];

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const el = listRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [activeMessages, isSending, activeSessionId]);

    const groupedSessions = useMemo(() => {
        const groups = new Map();
        for (const session of sessions) {
            const label = getSessionGroupLabel(session.updatedAt || session.createdAt);
            if (!groups.has(label)) {
                groups.set(label, []);
            }
            groups.get(label).push(session);
        }

        return ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Older"]
            .filter((label) => groups.has(label))
            .map((label) => [
                label,
                groups.get(label).sort(
                    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
                ),
            ]);
    }, [sessions]);

    useEffect(() => {
        loadSessions();
    }, []);

    async function loadSessions() {
        try {
            setIsLoadingSessions(true);
            setError("");

            const response = await fetch(`${API_BASE}/api/chat/sessions`);
            if (!response.ok) {
                throw new Error("We couldn't load free chat sessions right now.");
            }

            const data = await response.json();
            setSessions(data);

            if (data.length > 0) {
                const firstSessionId = data[0].sessionId;
                setActiveSessionId(firstSessionId);
                await loadSessionMessages(firstSessionId);
            } else {
                const created = await createNewSessionInternal();
                setActiveSessionId(created.sessionId);
            }
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't load free chat sessions right now."));
        } finally {
            setIsLoadingSessions(false);
        }
    }

    async function loadSessionMessages(sessionId) {
        try {
            setIsLoadingMessages(true);
            setError("");

            const response = await fetch(`${API_BASE}/api/chat/session/${encodeURIComponent(sessionId)}/messages`);
            if (!response.ok) {
                throw new Error("We couldn't load messages for this free chat session.");
            }

            const data = await response.json();
            const mappedMessages = (Array.isArray(data) ? data : []).map((message) => ({
                id: message.id,
                role: String(message.sender || "").toLowerCase() === "bot" ? "assistant" : "user",
                content: message.message,
                ts: message.createdAt,
                source: String(message.sender || "").toLowerCase() === "bot" ? "history" : "user",
            }));

            setMessagesBySession((prev) => ({
                ...prev,
                [sessionId]: mappedMessages.length ? mappedMessages : [createAssistantWelcomeMessage()],
            }));
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't load messages for this free chat session."));
        } finally {
            setIsLoadingMessages(false);
        }
    }

    async function createNewSessionInternal() {
        const response = await fetch(`${API_BASE}/api/chat/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicCode: "ACADEMIC_STRESS" }),
        });

        if (!response.ok) {
            throw new Error("We couldn't create a new free chat session.");
        }

        const session = await response.json();
        const normalized = {
            ...session,
            title: "New chat",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setSessions((prev) => [normalized, ...prev]);
        setMessagesBySession((prev) => ({
            ...prev,
            [session.sessionId]: [createAssistantWelcomeMessage()],
        }));

        return normalized;
    }

    async function handleNewChat() {
        try {
            const session = await createNewSessionInternal();
            setActiveSessionId(session.sessionId);
            setInput("");
            setError("");
            inputRef.current?.focus();
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't create a new free chat session."));
        }
    }

    async function handleOpenSession(sessionId) {
        setActiveSessionId(sessionId);
        if (!messagesBySession[sessionId]) {
            await loadSessionMessages(sessionId);
        }
        setError("");
    }

    function appendMessageToSession(sessionId, message) {
        setMessagesBySession((prev) => ({
            ...prev,
            [sessionId]: [...(prev[sessionId] || []), message],
        }));
    }

    function updateSessionLocally(sessionId, updater) {
        setSessions((prev) => prev.map((session) => (session.sessionId === sessionId ? updater(session) : session)));
    }

    async function sendMessage(text) {
        const trimmed = text.trim();
        if (!trimmed || isSending || !activeSessionId) return;

        setError("");
        setIsSending(true);

        const userMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: trimmed,
            ts: Date.now(),
            source: "user",
        };

        appendMessageToSession(activeSessionId, userMessage);

        updateSessionLocally(activeSessionId, (session) => ({
            ...session,
            title: !session.title || session.title === "New chat"
                ? (trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed)
                : session.title,
            updatedAt: new Date().toISOString(),
        }));

        setInput("");

        try {
            const response = await fetch(`${API_BASE}/api/chat/message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: String(activeSessionId),
                    message: trimmed,
                    summary: {},
                }),
            });

            if (!response.ok) {
                throw new Error("We couldn't send your free chat message right now.");
            }

            const data = await response.json();
            appendMessageToSession(activeSessionId, {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: data.reply || "Thanks for sharing. I'm here with you.",
                ts: Date.now(),
                source: data.source || "unknown",
                fallbackReason: data.fallbackReason || null,
            });
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't send your free chat message right now."));
            appendMessageToSession(activeSessionId, {
                id: `assistant-error-${Date.now()}`,
                role: "assistant",
                content: "I had trouble responding just now. Please try again in a moment.",
                ts: Date.now(),
                source: "system",
            });
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        sendMessage(input);
    }

    function getSourceMeta(message) {
        if (message.role !== "assistant") return null;
        if (message.source === "gemini") return { label: "Gemini", className: "free-chat-source is-gemini" };
        if (message.source === "fallback") return { label: "Fallback", className: "free-chat-source is-fallback" };
        if (message.source === "system") return { label: "System", className: "free-chat-source is-system" };
        return null;
    }

    return (
        <section className="free-chat-view">
            <section className="hero-panel free-chat-hero">
                <div className="free-chat-hero-copy">
                    <span className="free-chat-kicker">Free Chat</span>
                    <h2 className="free-chat-hero-title">A calmer space for open conversation when you just need to talk.</h2>
                    <p className="free-chat-hero-text">
                        Use this space for open-ended reflection, small emotional check-ins, or gentle support without starting a guided flow.
                    </p>
                </div>

                <div className="hero-stats free-chat-hero-stats">
                    <div className="hero-stat-card free-chat-stat-card">
                        <span className="hero-stat-label">Today</span>
                        <strong>{todayFull}</strong>
                        <small>{greeting}</small>
                    </div>
                    <div className="hero-stat-card free-chat-stat-card free-chat-stat-live">
                        <span className="hero-stat-label">Mode</span>
                        <strong>Open Talk</strong>
                        <small>Gemini and fallback labels appear on each reply</small>
                    </div>
                </div>
            </section>

            <section className="free-chat-shell">
            <aside className="free-chat-sidebar">
                <div className="free-chat-sidebar-top">
                    <div>
                        <p className="free-chat-brand">Open Talk</p>
                        <h2>{greeting}</h2>
                        <p>Browse recent chats or start a fresh conversation.</p>
                    </div>
                </div>

                <button type="button" className="free-chat-new-btn" onClick={handleNewChat}>
                    + New chat
                </button>

                <div className="free-chat-history">
                    {isLoadingSessions ? <p>Loading sessions...</p> : groupedSessions.map(([label, groupSessions]) => (
                        <div key={label} className="free-chat-history-group">
                            <p className="free-chat-history-label">{label}</p>
                            {groupSessions.map((session) => (
                                <button
                                    key={session.sessionId}
                                    type="button"
                                    className={`free-chat-history-item ${session.sessionId === activeSessionId ? "is-active" : ""}`}
                                    onClick={() => handleOpenSession(session.sessionId)}
                                >
                                    <strong>{session.title}</strong>
                                    <span>{formatTime(session.updatedAt || session.createdAt)}</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </aside>

            <div className="free-chat-main">
                <div className="free-chat-panel">
                    <header className="free-chat-header">
                        <div>
                            <span className="free-chat-kicker">Conversation</span>
                            <h2>Talk freely about what is on your mind.</h2>
                            <p>Quick prompts are here if you want help getting started, but you can type anything in your own words.</p>
                        </div>
                        <div className="free-chat-status">
                            <span className="free-chat-status-dot" />
                            Live
                        </div>
                    </header>

                    <div className="free-chat-quick-actions">
                        {quickActions.map((action) => (
                            <button key={action.id} type="button" className="free-chat-chip" onClick={() => sendMessage(action.message)}>
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="free-chat-messages" ref={listRef}>
                        {isLoadingMessages ? <p className="free-chat-loading">Loading messages...</p> : activeMessages.map((message) => {
                            const sourceMeta = getSourceMeta(message);
                            return (
                                <div
                                    key={message.id}
                                    className={`free-chat-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
                                >
                                    <div className={`free-chat-bubble ${message.role === "user" ? "is-user" : "is-assistant"}`}>
                                        <p>{message.content}</p>
                                        <div className="free-chat-meta">
                                            {sourceMeta ? <span className={sourceMeta.className}>{sourceMeta.label}</span> : null}
                                            <span>{formatTime(message.ts)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {isSending ? (
                            <div className="free-chat-row is-assistant">
                                <div className="free-chat-bubble is-assistant">
                                    <p>Thinking...</p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="free-chat-footer">
                        <form className="free-chat-form" onSubmit={onSubmit}>
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type how you feel..."
                                disabled={isSending || isLoadingMessages}
                            />
                            <button type="submit" disabled={isSending || isLoadingMessages || !input.trim()}>
                                Send
                            </button>
                        </form>
                        {error ? <p className="free-chat-error">{error}</p> : null}
                    </div>
                </div>
            </div>
            </section>
        </section>
    );
}
