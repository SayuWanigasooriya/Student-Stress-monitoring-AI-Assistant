import { useEffect, useMemo, useRef, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import Header from "./components/Header";
import ProfileScreen from "./components/ProfileScreen";
import QuestionCard from "./components/QuestionCard";
import ResultCard from "./components/ResultCard";
import TopicListCard from "./components/TopicListCard";
import { styles } from "./styles";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function App() {
    const hasInitializedHistory = useRef(false);
    const isRestoringHistory = useRef(false);
    const lastHistoryKey = useRef("");

    const [currentUser, setCurrentUser] = useState(() => {
        const raw = localStorage.getItem("currentUser");
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    });
    const [authMode, setAuthMode] = useState("login");
    const [activeView, setActiveView] = useState("home");

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
    const [showChat, setShowChat] = useState(false);

    // chat state
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [chatSessionId, setChatSessionId] = useState(null);
    const [chatSending, setChatSending] = useState(false);

    // ui state
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Load topics on start
    useEffect(() => {
        if (!currentUser) {
            setTopics([]);
            setLoadingTopics(false);
            return;
        }

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
    }, [currentUser]);

    // Questions can store their options as JSON, so we parse once whenever the question changes.
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
        if (t && typeof t.totalSteps === "number") return t.totalSteps;
        return null;
    }, [question, topics]);

    const progressPct = useMemo(() => {
        if (!question) return 0;
        if (!totalStepsForCurrentTopic) return 0;
        return Math.min(100, Math.round((question.stepNo / totalStepsForCurrentTopic) * 100));
    }, [question, totalStepsForCurrentTopic]);

    // Only push a new browser-history entry when the app moves to a meaningful new view/state.
    const historySyncKey = useMemo(() => JSON.stringify({
        authenticated: Boolean(currentUser),
        authMode,
        activeView,
        screen: question ? "question" : finalResult ? "result" : "home",
        sessionId,
        questionId: question?.questionId ?? null,
        finalSummary: finalResult?.summary ?? null,
        showChat,
        chatSessionId,
        chatMessagesCount: chatMessages.length,
    }), [currentUser, authMode, activeView, sessionId, question, finalResult, showChat, chatSessionId, chatMessages.length]);

    useEffect(() => {
        const handlePopState = (event) => {
            const snapshot = event.state?.appSnapshot;
            if (!snapshot) return;

            isRestoringHistory.current = true;

            setCurrentUser(snapshot.currentUser ?? null);
            setAuthMode(snapshot.authMode ?? "login");
            setActiveView(snapshot.activeView ?? "home");
            setSessionId(snapshot.sessionId ?? null);
            setQuestion(snapshot.question ?? null);
            setSelectedAnswer(snapshot.selectedAnswer ?? "");
            setTextAnswer(snapshot.textAnswer ?? "");
            setScaleAnswer(snapshot.scaleAnswer ?? 3);
            setFinalResult(snapshot.finalResult ?? null);
            setShowChat(snapshot.showChat ?? false);
            setChatInput(snapshot.chatInput ?? "");
            setChatMessages(snapshot.chatMessages ?? []);
            setChatSessionId(snapshot.chatSessionId ?? null);
            setChatSending(false);
            setError("");
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        const snapshot = {
            currentUser,
            authMode,
            activeView,
            sessionId,
            question,
            selectedAnswer,
            textAnswer,
            scaleAnswer,
            finalResult,
            showChat,
            chatInput,
            chatMessages,
            chatSessionId,
        };

        if (!hasInitializedHistory.current) {
            window.history.replaceState({ appSnapshot: snapshot }, "");
            hasInitializedHistory.current = true;
            lastHistoryKey.current = historySyncKey;
            return;
        }

        if (isRestoringHistory.current) {
            lastHistoryKey.current = historySyncKey;
            isRestoringHistory.current = false;
            return;
        }

        if (historySyncKey !== lastHistoryKey.current) {
            window.history.pushState({ appSnapshot: snapshot }, "");
            lastHistoryKey.current = historySyncKey;
        }
    }, [
        currentUser,
        authMode,
        activeView,
        sessionId,
        question,
        selectedAnswer,
        textAnswer,
        scaleAnswer,
        finalResult,
        showChat,
        chatInput,
        chatMessages,
        chatSessionId,
        historySyncKey,
    ]);

    const userId = useMemo(() => {
        if (!currentUser) return "";
        return String(currentUser.email || currentUser.id || "").trim();
    }, [currentUser]);

    const startSession = async (topicId) => {
        try {
            setBusy(true);
            setError("");
            setActiveView("home");

            // Starting a new guided session should clear any previous result/chat state.
            setFinalResult(null);
            setShowChat(false);
            setChatInput("");
            setChatMessages([]);
            setChatSessionId(null);
            setChatSending(false);

            const uid = userId.trim();
            if (!uid) {
                setError("Sign in before starting a topic.");
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

        // Convert the current UI control value into the single answer format expected by the backend.
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

            setSelectedAnswer("");
            setTextAnswer("");
            setScaleAnswer(3);

            // A session either moves to the next question or ends with a final summary/result.
            if (data.finalResult) {
                setFinalResult(data.finalResult);
                setQuestion(null);
                setSessionId(null);
            } else if (data.nextQuestion) {
                setQuestion(data.nextQuestion);
            } else {
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

    const openChat = async () => {
        try {
            setError("");

            // Reuse the topic from the final result so the follow-up chat stays in the same support area.
            const topicCode =
                finalResult?.topicCode ||
                finalResult?.topicId ||
                "ACADEMIC_STRESS";

            const res = await fetch(`${API_BASE}/api/chat/session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topicCode }),
            });

            if (!res.ok) throw new Error(`Failed to create chat session (${res.status})`);

            const data = await res.json();

            setChatSessionId(data.sessionId);
            setShowChat(true);
            setChatInput("");
            setChatMessages([
                { sender: "bot", message: "Hello. I can continue helping you with this topic." }
            ]);
        } catch (e) {
            setError(e.message || "Failed to open chat");
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || !chatSessionId || chatSending) return;

        const userMessage = chatInput.trim();

        // Show the user's message immediately, then append the bot reply when the API call completes.
        setChatMessages((prev) => [
            ...prev,
            { sender: "user", message: userMessage }
        ]);
        setChatInput("");
        setChatSending(true);

        try {
            const res = await fetch(`${API_BASE}/api/chat/message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: String(chatSessionId),
                    message: userMessage,
                    summary: finalResult,
                }),
            });

            if (!res.ok) throw new Error(`Failed to send message (${res.status})`);

            const data = await res.json();

            setChatMessages((prev) => [
                ...prev,
                { sender: "bot", message: data.reply }
            ]);
        } catch (e) {
            setError(e.message || "Failed to send chat message");
        } finally {
            setChatSending(false);
        }
    };

    const resetAll = () => {
        setActiveView("home");
        setSessionId(null);
        setQuestion(null);
        setFinalResult(null);
        setSelectedAnswer("");
        setTextAnswer("");
        setScaleAnswer(3);
        setShowChat(false);
        setChatInput("");
        setChatMessages([]);
        setChatSessionId(null);
        setChatSending(false);
        setError("");
    };

    const handleAuthSuccess = (user) => {
        setCurrentUser(user);
        setAuthMode("login");
        setActiveView("home");
        setError("");
        resetAll();
    };

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        setCurrentUser(null);
        setAuthMode("login");
        setActiveView("home");
        resetAll();
    };

    const isProfileView = Boolean(currentUser) && activeView === "profile";
    const isHomeScreen = !question && !finalResult && !isProfileView;

    return (
        <div style={styles.page} className="app-shell">
            <div className="app-orb app-orb-left" />
            <div className="app-orb app-orb-right" />

            <div style={styles.container} className="app-container">
                {!currentUser ? (
                    <AuthScreen
                        mode={authMode}
                        setMode={setAuthMode}
                        userApiBase={API_BASE}
                        onAuthSuccess={handleAuthSuccess}
                    />
                ) : (
                    <>
                        <Header
                            currentUser={currentUser}
                            onOpenProfile={() => setActiveView("profile")}
                            onOpenHome={() => setActiveView("home")}
                            onLogout={handleLogout}
                            busy={busy}
                            isProfileView={isProfileView}
                        />

                        {error && <div style={styles.error}>{error}</div>}

                        {isProfileView ? (
                            <ProfileScreen
                                currentUser={currentUser}
                                userApiBase={API_BASE}
                                onUserUpdated={setCurrentUser}
                                onLogout={handleLogout}
                            />
                        ) : null}

                        {isHomeScreen && (
                            <section className="hero-panel">
                                <div>
                                    <p className="eyebrow">Support Space</p>
                                    <h2 className="hero-title">Start with a topic, reflect step by step, and continue with helpful guidance.</h2>
                                    <p className="hero-copy">
                                        Choose the area you want support with and move through the conversation at your own pace.
                                    </p>
                                </div>

                                <div className="hero-stats">
                                    <div className="hero-stat-card">
                                        <span className="hero-stat-label">Topics</span>
                                        <strong>{topics.length}</strong>
                                    </div>
                                    <div className="hero-stat-card">
                                        <span className="hero-stat-label">Signed In As</span>
                                        <strong>{currentUser.name || userId || "Account connected"}</strong>
                                    </div>
                                    <div className="hero-stat-card">
                                        <span className="hero-stat-label">What You Get</span>
                                        <strong>Guided steps and follow-up chat</strong>
                                    </div>
                                </div>
                            </section>
                        )}

                        {question && !isProfileView && (
                            <QuestionCard
                                question={question}
                                totalStepsForCurrentTopic={totalStepsForCurrentTopic}
                                progressPct={progressPct}
                                parsedOptions={parsedOptions}
                                selectedAnswer={selectedAnswer}
                                setSelectedAnswer={setSelectedAnswer}
                                textAnswer={textAnswer}
                                setTextAnswer={setTextAnswer}
                                scaleAnswer={scaleAnswer}
                                setScaleAnswer={setScaleAnswer}
                                submitAnswer={submitAnswer}
                                resetAll={resetAll}
                                busy={busy}
                            />
                        )}

                        {finalResult && !isProfileView && (
                            <ResultCard
                                finalResult={finalResult}
                                showChat={showChat}
                                openChat={openChat}
                                resetAll={resetAll}
                                chatMessages={chatMessages}
                                chatInput={chatInput}
                                setChatInput={setChatInput}
                                sendChatMessage={sendChatMessage}
                                chatSending={chatSending}
                            />
                        )}

                        {isHomeScreen && (
                            <TopicListCard
                                loadingTopics={loadingTopics}
                                topics={topics}
                                startSession={startSession}
                                busy={busy}
                                userId={userId}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
