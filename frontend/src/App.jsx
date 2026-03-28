import { useCallback, useEffect, useMemo, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import Header from "./components/Header";
import ProfileScreen from "./components/ProfileScreen";
import QuestionCard from "./components/QuestionCard";
import ResultCard from "./components/ResultCard";
import TopicListCard from "./components/TopicListCard";
import useBrowserHistory from "./hooks/useBrowserHistory";
import usePersistedUser from "./hooks/usePersistedUser";
import { styles } from "./styles";
import { API_BASE, createSupportIntroMessage, getAnswerValue, getFriendlyMessage } from "./utils/appHelpers";

export default function App() {
    const { currentUser, setCurrentUser, clearCurrentUser } = usePersistedUser();
    const [authMode, setAuthMode] = useState("login");
    const [activeView, setActiveView] = useState("home");

    const [topics, setTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(true);

    const [sessionId, setSessionId] = useState(null);
    const [question, setQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [textAnswer, setTextAnswer] = useState("");
    const [scaleAnswer, setScaleAnswer] = useState(3);

    const [finalResult, setFinalResult] = useState(null);
    const [showChat, setShowChat] = useState(false);

    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [chatSessionId, setChatSessionId] = useState(null);
    const [chatSending, setChatSending] = useState(false);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

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
                if (!res.ok) throw new Error("We couldn't load the support topics right now.");
                const data = await res.json();
                setTopics(data);
            } catch (e) {
                setError(getFriendlyMessage(e, "We couldn't load the support topics right now."));
            } finally {
                setLoadingTopics(false);
            }
        })();
    }, [currentUser]);

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
        const topic = topics.find((item) => item.id === question.topicId);
        if (topic && typeof topic.totalSteps === "number") return topic.totalSteps;
        return null;
    }, [question, topics]);

    const progressPct = useMemo(() => {
        if (!question || !totalStepsForCurrentTopic) return 0;
        return Math.min(100, Math.round((question.stepNo / totalStepsForCurrentTopic) * 100));
    }, [question, totalStepsForCurrentTopic]);

    const applySnapshot = useCallback((snapshot) => {
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
    }, [setCurrentUser]);

    const historyState = useMemo(() => ({
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
    }), [
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
    ]);

    useBrowserHistory(historyState, applySnapshot);

    const userId = useMemo(() => {
        if (!currentUser) return "";
        return String(currentUser.email || currentUser.id || "").trim();
    }, [currentUser]);

    const resetAll = useCallback(() => {
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
    }, []);

    const startSession = async (topicId) => {
        try {
            setBusy(true);
            setError("");
            setActiveView("home");
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
            if (!res.ok) throw new Error("We couldn't start this topic right now.");

            const data = await res.json();
            setSessionId(data.sessionId);
            setQuestion(data.firstQuestion);
            setSelectedAnswer("");
            setTextAnswer("");
            setScaleAnswer(3);
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't start this topic right now."));
        } finally {
            setBusy(false);
        }
    };

    const submitAnswer = async () => {
        if (!sessionId || !question) return;

        const answerValue = getAnswerValue(question, { selectedAnswer, textAnswer, scaleAnswer });

        if (!answerValue) {
            setError("Please choose or type an answer before continuing.");
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
            if (!res.ok) throw new Error("We couldn't save your answer right now.");

            const data = await res.json();
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
                setFinalResult({ summary: "Session completed.", recommendations: [] });
                setQuestion(null);
                setSessionId(null);
            }
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't save your answer right now."));
        } finally {
            setBusy(false);
        }
    };

    const openChat = async () => {
        try {
            setError("");

            const topicCode = finalResult?.topicCode || finalResult?.topicId || "ACADEMIC_STRESS";

            const res = await fetch(`${API_BASE}/api/chat/session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topicCode }),
            });

            if (!res.ok) throw new Error("We couldn't open the support chat right now.");

            const data = await res.json();
            setChatSessionId(data.sessionId);
            setShowChat(true);
            setChatInput("");
            setChatMessages([createSupportIntroMessage()]);
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't open the support chat right now."));
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || !chatSessionId || chatSending) return;

        const userMessage = chatInput.trim();
        setChatMessages((prev) => [...prev, { sender: "user", message: userMessage }]);
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

            if (!res.ok) throw new Error("We couldn't send your message right now.");

            const data = await res.json();
            setChatMessages((prev) => [...prev, { sender: "bot", message: data.reply }]);
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't send your message right now."));
        } finally {
            setChatSending(false);
        }
    };

    const handleAuthSuccess = (user) => {
        setCurrentUser(user);
        setAuthMode("login");
        setActiveView("home");
        setError("");
        resetAll();
    };

    const handleLogout = () => {
        clearCurrentUser();
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
                                    <h2 className="hero-title">Start with one area, move step by step, and take support at your own pace.</h2>
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
