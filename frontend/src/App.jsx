import "./App.css";
import AuthScreen from "./components/AuthScreen";
import DailyCheckInScreen from "./components/DailyCheckInScreen";
import Header from "./components/Header";
import ProfileScreen from "./components/ProfileScreen";
import QuestionCard from "./components/QuestionCard";
import ResultCard from "./components/ResultCard";
import StatusPanel from "./components/StatusPanel";
import TopicListCard from "./components/TopicListCard";
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
    const isHomeScreen = !question && !finalResult && !isProfileView && !isCheckInView;

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
                            onOpenCheckIn={() => setActiveView("checkin")}
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

                        {isCheckInView ? <DailyCheckInScreen currentUser={currentUser} /> : null}

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
                                onRetry={loadTopics}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
