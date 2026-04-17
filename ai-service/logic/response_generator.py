from dotenv import load_dotenv

from logic.decision_logic import ImpactLevel, IndicatorLevel
from logic.gemini_api import gemini_enabled, generate_text
from logic.rag import retrieve_context


load_dotenv()


MOOD_KEYWORDS = [
    "happy",
    "calm",
    "motivat",
    "okay",
    "stress",
    "anxi",
    "sad",
    "tired",
    "feel",
    "mood",
    "depress",
    "angry",
    "overwhelm",
    "day",
    "today",
    "life",
    "friend",
    "school",
    "work",
]


def _is_mood_related(message: str) -> bool:
    return any(word in message.lower() for word in MOOD_KEYWORDS)


def _build_personalized_fallback_message(
    exact_mood: str,
    intensity: int,
    history: str,
    time_of_day: str,
    rag_context: str,
) -> str:
    mood_label = exact_mood.strip() if exact_mood and exact_mood.strip() else "this way"
    time_label = time_of_day if time_of_day and time_of_day.strip() else "right now"
    history_label = history.strip() if history and history.strip() else "recent patterns have been uneven"
    context_chunks = [chunk.strip() for chunk in rag_context.split("\n\n") if chunk.strip()]
    first_grounding = context_chunks[0] if context_chunks else ""
    second_grounding = context_chunks[1] if len(context_chunks) > 1 else ""

    immediate_step = "take one slower breath and let your shoulders drop before choosing the next task"
    tomorrow_focus = "protect a lighter evening and keep the next step small enough to finish in under ten minutes"

    if intensity >= 4:
        immediate_step = "step away for five minutes, breathe with a longer exhale, and shrink tonight's next task"
    elif "tired" in mood_label.lower():
        immediate_step = "pause for water, look away from screens, and lower the pressure on the next hour"

    message = (
        f"Feeling {mood_label} around {time_label} makes sense, especially when your recent pattern has already been carrying strain. "
        f"Start with one gentle reset: {immediate_step}. That kind of smaller move is often more helpful than forcing yourself through a heavy plan when your stress is sitting around {intensity}/5.\n\n"
        f"Your recent pattern looks like {history_label}, so tonight is probably more about recovery than performance. "
        f"For tomorrow, {tomorrow_focus}."
    )

    if first_grounding:
        message += f" A grounded support idea from your care guide is: {first_grounding}"
    if second_grounding:
        message += f" Another steadying reminder is: {second_grounding}"

    return message


async def generate_personalized_response(
    user_message: str,
    emotion_category: str,
    impact_level: str,
    indicator_level: str,
    exact_mood: str = "",
    intensity: int = 3,
    history: str = "",
    time_of_day: str = "",
) -> dict:
    generation_source = "fallback"
    system_prompt = (
        "You are an empathetic, emotionally aware AI assistant for a mental health system.\n"
        "Your task is to provide a personalized, supportive response to the user.\n\n"
        f"Detected Emotion Category: {emotion_category}\n"
        f"Wellbeing Impact Level: {impact_level}\n"
        f"Mental Status Indicator: {indicator_level}\n\n"
    )

    rag_context = retrieve_context(user_message)
    if rag_context.strip():
        system_prompt += (
            "--- RELEVANT THERAPEUTIC CONTEXT ---\n"
            f"{rag_context}\n"
            "------------------------------------\n"
            "Use the provided context above to inform and ground your response securely.\n\n"
        )

    if indicator_level == IndicatorLevel.ELEVATED.value:
        system_prompt += (
            "SAFETY RULE ACTIVATED (Elevated Indicator): The user is showing signs of elevated "
            "mental stress. You must use gentle, non-overwhelming language. Validate their "
            "feelings and suggest professional help as a soft footnote.\n\n"
        )
    else:
        system_prompt += "SAFETY RULE: Standard conversational empathy. Be supportive and encouraging.\n\n"

    system_prompt += (
        "IMPORTANT VALIDATION: If the user's message is completely off-topic, nonsensical, or "
        "unrelated to their mental health, mood, or a daily reflection, politely refuse and ask "
        "them to stay on topic.\n\n"
        "Otherwise, generate a deeply warm, conversational, and highly empathetic response in two natural paragraphs.\n"
        "Do not use markdown headers, bullet points, or labels.\n\n"
        "Paragraph 1 must include:\n"
        "- Validation of the user's exact feeling.\n"
        "- One immediate action they can take now.\n"
        "- One short-term coping strategy tailored to their intensity level.\n"
        "- One long-term resilience habit.\n"
        f"- A gentle explanation of why these steps fit their current state and time ({time_of_day}).\n\n"
        "Paragraph 2 must include:\n"
        f"- A natural reflection on patterns from their history ({history}).\n"
        "- A possible situational trigger if applicable.\n"
        "- A gentle prediction for the next 1-2 days.\n"
        "- One personalized suggestion for tomorrow.\n"
    )

    try:
        if not gemini_enabled():
            if user_message and user_message != "I am logging my mood.":
                if not _is_mood_related(user_message):
                    return {
                        "ai_message": "It looks like your note is unrelated to your mood or feelings. I am a dedicated mental health assistant, so please keep your reflections focused on your well-being so I can give more useful support.",
                        "immediate_delivery_ways": "None",
                        "dashboard_suggestions": [],
                        "generation_source": generation_source,
                    }

            ai_message = _build_personalized_fallback_message(
                exact_mood=exact_mood,
                intensity=intensity,
                history=history,
                time_of_day=time_of_day,
                rag_context=rag_context,
            )
        else:
            ai_message = await generate_text(f"{system_prompt}\nUser message:\n{user_message}")
            generation_source = "gemini"
    except Exception as exc:
        error_msg = str(exc)
        if "401" in error_msg or "API key" in error_msg:
            ai_message = _build_personalized_fallback_message(
                exact_mood=exact_mood,
                intensity=intensity,
                history=history,
                time_of_day=time_of_day,
                rag_context=rag_context,
            )
        else:
            ai_message = _build_personalized_fallback_message(
                exact_mood=exact_mood,
                intensity=intensity,
                history=history,
                time_of_day=time_of_day,
                rag_context=rag_context,
            )

    dashboard_suggestions = []
    exact_mood_lower = exact_mood.lower()

    if "happy" in exact_mood_lower:
        dashboard_suggestions = ["Start a gratitude journal", "Share your joy with a friend", "Work on a creative hobby"]
    elif "calm" in exact_mood_lower:
        dashboard_suggestions = ["Mindful meditation", "Take a nature walk", "Read a book with tea"]
    elif "motivated" in exact_mood_lower:
        dashboard_suggestions = ["Set achievable goals", "Tackle a challenging task", "Do an intensive workout session"]
    elif "okay" in exact_mood_lower:
        dashboard_suggestions = ["Light stretching across the room", "Listen to an engaging podcast", "Maintain your daily routine safely"]
    elif "stressed" in exact_mood_lower:
        dashboard_suggestions = ["Use the 5-5-5 breathing technique", "Protect a recovery-first evening", "Write down the one task that still matters tonight"]
    elif "anxi" in exact_mood_lower:
        dashboard_suggestions = ["5-4-3-2-1 sensory grounding exercise", "Write down your worries on paper", "Reach out to one trusted friend"]
    elif "sad" in exact_mood_lower:
        dashboard_suggestions = ["Take a self-compassion break", "Reach out to one trusted friend", "Write down what feels heaviest"]
    elif "tired" in exact_mood_lower:
        dashboard_suggestions = ["Protect a recovery-first evening", "Hydrate immediately", "Try some gentle stretches"]
    else:
        if impact_level in [ImpactLevel.MODERATE.value, ImpactLevel.HIGH.value]:
            dashboard_suggestions = ["Use the 5-5-5 breathing technique", "Write down what feels heaviest", "Reach out to one trusted friend"]
        else:
            dashboard_suggestions = ["Reflect on your day", "Protect a recovery-first evening"]

    return {
        "ai_message": ai_message,
        "immediate_delivery_ways": "Chat response",
        "dashboard_suggestions": dashboard_suggestions,
        "generation_source": generation_source,
    }


async def generate_chat_response(messages_history: list) -> str:
    latest_user_message = ""
    for message in reversed(messages_history):
        if message.get("role") == "user":
            latest_user_message = message.get("content", "")
            break

    rag_context = retrieve_context(latest_user_message)
    system_prompt = (
        "You are an empathetic, emotionally aware AI assistant for a mental health system.\n"
        "Your task is to provide a conversational, supportive response to the user's message.\n"
        "IMPORTANT: The user must only ask about mood recommendations or describe their mood. "
        "If the user says something short like 'hi', or talks about unrelated topics, politely decline and ask them to describe their mood descriptively.\n\n"
    )
    if rag_context.strip():
        system_prompt += (
            "--- RELEVANT THERAPEUTIC CONTEXT ---\n"
            f"{rag_context}\n"
            "------------------------------------\n"
            "Use the provided context to inform your response naturally.\n\n"
        )

    try:
        if not gemini_enabled():
            mood_keywords = [
                "happy",
                "calm",
                "motivated",
                "okay",
                "stressed",
                "anxi",
                "sad",
                "tired",
                "feel",
                "mood",
                "depress",
                "angry",
                "overwhelmed",
            ]
            is_mood_related = any(word in latest_user_message.lower() for word in mood_keywords)

            if not is_mood_related or len(latest_user_message.split()) < 3:
                return "Please describe your mood or feelings more clearly. I am here to provide mental health recommendations and cannot assist with unrelated topics or very short greetings."

            return rag_context.strip() if rag_context.strip() else "I hear you, and I am here to support you."

        history_block = []
        for message in messages_history:
            role = "assistant" if message.get("role") == "ai" else message.get("role", "user")
            history_block.append(f"{role}: {message.get('content', '')}")

        prompt = f"{system_prompt}\nConversation:\n" + "\n".join(history_block)
        return await generate_text(prompt)
    except Exception as exc:
        return f"I am here to chat, but my systems are experiencing an error: {str(exc)}"
