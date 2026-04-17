import "./App.css";
import AuthScreen from "./components/AuthScreen";
import DailyCheckInScreen from "./components/DailyCheckInScreen";
import FreeChatScreen from "./components/FreeChatScreen";
import GuidedSupportScreen from "./components/GuidedSupportScreen";
import Header from "./components/Header";
import HomeDashboardScreen from "./components/HomeDashboardScreen";
import ProfileScreen from "./components/ProfileScreen";
import RecommendationsDashboardScreen from "./components/RecommendationsDashboardScreen";
import StatusPanel from "./components/StatusPanel";
import useSupportApp from "./hooks/useSupportApp";
import { styles } from "./styles";
import { API_BASE } from "./utils/appHelpers";

export default function App() {
    const {
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
        loadTopics,
        startSession,
        submitAnswer,
        openChat,
        sendChatMessage,
        handleAuthSuccess,
        handleLogout,
        resetAll,
    } = useSupportApp();

    const isProfileView = Boolean(currentUser) && activeView === "profile";
    const isCheckInView = Boolean(currentUser) && activeView === "checkin";
    const isRecommendationsView = Boolean(currentUser) && activeView === "recommendations";
    const isSupportView = Boolean(currentUser) && activeView === "support";
    const isHomeScreen = Boolean(currentUser) && activeView === "home";
    const isFreeChatView = Boolean(currentUser) && activeView === "freechat";

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
                            onOpenSupport={() => setActiveView("support")}
                            onOpenCheckIn={() => setActiveView("checkin")}
                            onOpenRecommendations={() => setActiveView("recommendations")}
                            onOpenFreeChat={() => setActiveView("freechat")}
                            onLogout={handleLogout}
                            busy={busy}
                            activeView={activeView}
                        />

                        {error ? (
                            <StatusPanel
                                tone="error"
                                title="Something needs attention"
                                message={error}
                                action={isHomeScreen ? { label: "Try again", onClick: loadTopics } : undefined}
                            />
                        ) : null}

                        {isProfileView ? (
                            <ProfileScreen
                                currentUser={currentUser}
                                userApiBase={API_BASE}
                                onUserUpdated={setCurrentUser}
                                onLogout={handleLogout}
                            />
                        ) : null}

                        {isHomeScreen && (
                            <HomeDashboardScreen
                                currentUser={currentUser}
                                topics={topics}
                                onOpenSupport={() => setActiveView("support")}
                                onOpenCheckIn={() => setActiveView("checkin")}
                                onOpenRecommendations={() => setActiveView("recommendations")}
                            />
                        )}

                        {isSupportView ? (
                            <GuidedSupportScreen
                                question={question}
                                finalResult={finalResult}
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
                                chatMessages={chatMessages}
                                chatInput={chatInput}
                                setChatInput={setChatInput}
                                sendChatMessage={sendChatMessage}
                                chatSending={chatSending}
                                showChat={showChat}
                                openChat={openChat}
                                loadingTopics={loadingTopics}
                                topics={topics}
                                startSession={startSession}
                                busy={busy}
                                userId={userId}
                                onRetry={loadTopics}
                            />
                        ) : null}

                        {isCheckInView ? <DailyCheckInScreen currentUser={currentUser} /> : null}

                        {isRecommendationsView ? <RecommendationsDashboardScreen currentUser={currentUser} /> : null}

                        {isFreeChatView ? <FreeChatScreen /> : null}
                    </>
                )}
            </div>
        </div>
    );
}
