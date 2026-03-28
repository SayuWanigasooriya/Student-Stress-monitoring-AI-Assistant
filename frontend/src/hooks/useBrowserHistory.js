import { useEffect, useMemo, useRef } from "react";

export default function useBrowserHistory(state, applySnapshot) {
    const hasInitializedHistory = useRef(false);
    const isRestoringHistory = useRef(false);
    const lastHistoryKey = useRef("");

    const historySyncKey = useMemo(() => JSON.stringify({
        authenticated: Boolean(state.currentUser),
        authMode: state.authMode,
        activeView: state.activeView,
        screen: state.question ? "question" : state.finalResult ? "result" : "home",
        sessionId: state.sessionId,
        questionId: state.question?.questionId ?? null,
        finalSummary: state.finalResult?.summary ?? null,
        showChat: state.showChat,
        chatSessionId: state.chatSessionId,
        chatMessagesCount: state.chatMessages.length,
    }), [
        state.currentUser,
        state.authMode,
        state.activeView,
        state.sessionId,
        state.question,
        state.finalResult,
        state.showChat,
        state.chatSessionId,
        state.chatMessages.length,
    ]);

    useEffect(() => {
        const handlePopState = (event) => {
            const snapshot = event.state?.appSnapshot;
            if (!snapshot) return;

            isRestoringHistory.current = true;
            applySnapshot(snapshot);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [applySnapshot]);

    useEffect(() => {
        if (!hasInitializedHistory.current) {
            window.history.replaceState({ appSnapshot: state }, "");
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
            window.history.pushState({ appSnapshot: state }, "");
            lastHistoryKey.current = historySyncKey;
        }
    }, [state, historySyncKey]);
}
