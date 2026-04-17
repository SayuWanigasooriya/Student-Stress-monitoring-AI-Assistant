import QuestionCard from "./QuestionCard";
import ResultCard from "./ResultCard";
import TopicListCard from "./TopicListCard";

export default function GuidedSupportScreen(props) {
    const {
        question,
        finalResult,
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
        chatMessages,
        chatInput,
        setChatInput,
        sendChatMessage,
        chatSending,
        showChat,
        openChat,
        loadingTopics,
        topics,
        startSession,
        busy,
        userId,
        onRetry,
    } = props;
    const topicCount = topics?.length ?? 0;

    return (
        <section className="guided-support-shell">
            <section className="hero-panel guided-support-hero">
                <div className="guided-support-hero-copy">
                    <p className="eyebrow">Guided Support</p>
                    <h2 className="hero-title guided-support-title">Choose a support topic and start with one clear next step.</h2>
                    <p className="hero-copy">
                        Pick the area that feels most urgent right now. We will guide you through it one question at a time, then keep your summary and follow-up chat in one place.
                    </p>
                </div>

                <div className="hero-stats guided-support-hero-stats">
                    <div className="hero-stat-card guided-support-stat-card guided-support-stat-accent">
                        <span className="guided-support-stat-kicker">Available now</span>
                        <strong>{topicCount} topics ready</strong>
                        <small>Choose one topic and keep the support focused instead of juggling everything at once.</small>
                    </div>
                    <div className="hero-stat-card guided-support-stat-card">
                        <span className="guided-support-stat-kicker">How it works</span>
                        <strong>Step-by-step guidance</strong>
                        <small>Move through questions, get a summary, and continue with follow-up chat if you need it.</small>
                    </div>
                    <div className="guided-support-benefits" aria-label="Guided support benefits">
                        <span>One topic at a time</span>
                        <span>Clear summary at the end</span>
                        <span>Follow-up chat included</span>
                    </div>
                </div>
            </section>

            {question ? (
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
            ) : finalResult ? (
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
            ) : (
                <TopicListCard
                    loadingTopics={loadingTopics}
                    topics={topics}
                    startSession={startSession}
                    busy={busy}
                    userId={userId}
                    onRetry={onRetry}
                />
            )}
        </section>
    );
}
