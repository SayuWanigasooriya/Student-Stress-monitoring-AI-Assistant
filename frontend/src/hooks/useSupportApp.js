import { useCallback, useEffect, useMemo, useState } from "react";
import useBrowserHistory from "./useBrowserHistory";
import usePersistedUser from "./usePersistedUser";
import { API_BASE, createSupportIntroMessage, getAnswerValue, getFriendlyMessage } from "../utils/appHelpers";

export default function useSupportApp() {
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

    const loadTopics = useCallback(async () => {
        if (!currentUser) {
            setTopics([]);
            setLoadingTopics(false);
            return;
        }

        try {
            setLoadingTopics(true);
            setError("");
            const res = await fetch(`${API_BASE}/topics`);
            if (!res.ok) throw new Error("We couldn't load the support topics right now.");
            setTopics(await res.json());
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't load the support topics right now."));
        } finally {
            setLoadingTopics(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadTopics();
    }, [loadTopics]);

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
        return topic && typeof topic.totalSteps === "number" ? topic.totalSteps : null;
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
        setActiveView("support");
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

    const startSession = useCallback(async (topicId) => {
        try {
            setBusy(true);
            setError("");
            setActiveView("support");
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
    }, [userId]);

    const submitAnswer = useCallback(async () => {
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
    }, [question, scaleAnswer, selectedAnswer, sessionId, textAnswer]);

    const openChat = useCallback(async () => {
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
    }, [finalResult]);

    const sendChatMessage = useCallback(async () => {
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
            setChatMessages((prev) => [...prev, {
                sender: "bot",
                message: data.reply,
                source: data.source || "unknown",
                fallbackReason: data.fallbackReason || null,
            }]);
        } catch (e) {
            setError(getFriendlyMessage(e, "We couldn't send your message right now."));
        } finally {
            setChatSending(false);
        }
    }, [chatInput, chatSending, chatSessionId, finalResult]);

    const handleAuthSuccess = useCallback((user) => {
        setCurrentUser(user);
        setAuthMode("login");
        setActiveView("home");
        setError("");
        resetAll();
    }, [resetAll, setCurrentUser]);

    const handleLogout = useCallback(() => {
        clearCurrentUser();
        setAuthMode("login");
        setActiveView("home");
        resetAll();
    }, [clearCurrentUser, resetAll]);

    return {
        currentUser,
        authMode,
        activeView,
        topics,
        loadingTopics,
        question,
        selectedAnswer,
        textAnswer,
        scaleAnswer,
        finalResult,
        showChat,
        chatInput,
        chatMessages,
        chatSending,
        busy,
        error,
        parsedOptions,
        totalStepsForCurrentTopic,
        progressPct,
        userId,
        setAuthMode,
        setActiveView,
        setSelectedAnswer,
        setTextAnswer,
        setScaleAnswer,
        setChatInput,
        setCurrentUser,
        clearCurrentUser,
        loadTopics,
        startSession,
        submitAnswer,
        openChat,
        sendChatMessage,
        handleAuthSuccess,
        handleLogout,
        resetAll,
    };
}
