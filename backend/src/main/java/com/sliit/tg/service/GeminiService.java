package com.sliit.tg.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.sliit.tg.dto.EmotionResponse;
import com.sliit.tg.model.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final Client client;
    private final String modelName;

    public GeminiService(
            @Value("${app.gemini.model:gemini-2.5-flash}") String modelName
    ) {
        this.client = Client.builder().build();
        this.modelName = modelName;
    }

    public String getReply(String topicCode,
                           List<ChatMessage> history,
                           String userMessage,
                           Map<String, Object> summary,
                           EmotionResponse emotionResult) {
        // The prompt blends three things: topic context, completed assessment context, and live emotion context.
        StringBuilder prompt = new StringBuilder();

        prompt.append(buildSystemPrompt(topicCode)).append("\n\n");

        if (summary != null && !summary.isEmpty()) {
            prompt.append("The user has already completed a structured guidance assessment.\n");

            Object impactLevel = summary.get("impactLevel");
            if (impactLevel != null) {
                prompt.append("Impact Level: ").append(impactLevel).append("\n");
            }

            Object summaryText = summary.get("summary");
            if (summaryText != null) {
                prompt.append("Guidance Summary: ").append(summaryText).append("\n");
            }

            Object recommendations = summary.get("recommendations");
            if (recommendations != null) {
                prompt.append("Recommendations: ").append(recommendations).append("\n");
            }

            prompt.append("\n");
        }

        String normalizedEmotion = "unknown";

        if (emotionResult != null && emotionResult.getEmotion() != null) {
            normalizedEmotion = emotionResult.getEmotion().trim().toLowerCase();

            prompt.append("Detected emotion: ").append(emotionResult.getEmotion()).append("\n");
            prompt.append("Emotion confidence: ").append(emotionResult.getScore()).append("\n");
            prompt.append("You must adapt your tone and response based on the detected emotion.\n");

            switch (normalizedEmotion) {
                case "sadness":
                    prompt.append("If the emotion is sadness, respond gently, validate feelings, and give small manageable steps.\n");
                    break;
                case "fear":
                    prompt.append("If the emotion is fear, respond calmly, reduce panic, and suggest grounding or reassurance.\n");
                    break;
                case "anger":
                    prompt.append("If the emotion is anger, respond calmly, avoid sounding defensive, and guide the user toward slowing down before acting.\n");
                    break;
                case "joy":
                    prompt.append("If the emotion is joy, respond positively and supportively while staying relevant to the topic.\n");
                    break;
                case "disgust":
                    prompt.append("If the emotion is disgust, respond carefully and help the user explain what is bothering them.\n");
                    break;
                case "surprise":
                    prompt.append("If the emotion is surprise, respond clearly and help the user process what happened.\n");
                    break;
                case "neutral":
                case "neutrality":
                    prompt.append("If the emotion is neutral, respond naturally, clearly, and helpfully.\n");
                    break;
                default:
                    prompt.append("Respond empathetically according to the detected emotion.\n");
                    break;
            }

            prompt.append("\n");
        }

        prompt.append("""
CRITICAL RULES:
- Emotion is more important than productivity advice.
- If the detected emotion is anger, sadness, fear, disgust, or surprise, respond to the emotion first.
- Do not immediately jump into study techniques or task planning when the user is emotionally intense.
- First calm, validate, or stabilize the user.
- Only after emotional support, give light practical advice if appropriate.
- Do not force the same recommendations every time.
- Do not automatically repeat Pomodoro, 20-minute tasks, or 3-item lists unless clearly relevant.
- Use the summary as background context, but do not let it dominate the reply when the user's emotion is strong.
- If the user sounds highly emotional, prioritize empathy first, practical advice second.
- Write in plain natural text only.
- Do not use markdown formatting like **, *, bullets, or headings.
- Keep the response concise but human.
- Prefer 2 to 4 short sentences.
- Give only one small next step at a time.
- If a follow-up question is helpful, ask only one short question.
- Avoid long paragraphs.
- Avoid sounding like a lecture, checklist, or counseling script.
- Do not diagnose medical or mental health conditions.

Emotion-specific priority:
- sadness: comfort first, then one tiny manageable step
- fear: calm first, reassurance first, grounding first
- anger: de-escalate first, encourage pause before action
- joy: affirm positively, then respond helpfully
- neutral: practical balanced advice is fine

""");

        prompt.append("Conversation history:\n");

        // History is included so the model can continue the conversation instead of answering in isolation.
        for (ChatMessage msg : history) {
            prompt.append(msg.getSender()).append(": ").append(msg.getMessage()).append("\n");
        }

        prompt.append("user: ").append(userMessage).append("\n\n");

        prompt.append("Reply rules:\n");
        prompt.append("- Be warm, supportive, and practical.\n");
        prompt.append("- Use both the assessment context and detected emotion.\n");
        prompt.append("- Do not ignore the user's emotional state.\n");
        prompt.append("- If emotion is strong, respond to feelings before giving structured advice.\n");
        prompt.append("- Avoid repeating the exact same recommendations unless clearly relevant.\n");
        prompt.append("- If the user sounds overwhelmed, break help into the smallest next step.\n");
        prompt.append("- Keep replies short enough to feel natural in a chat app.\n");
        prompt.append("- Usually stay under about 70 words unless the user clearly asks for more detail.\n");
        prompt.append("- Prefer one paragraph, not multiple long blocks of text.\n");
        prompt.append("- No markdown, no bullet points, no headings.\n\n");

        prompt.append("bot:");

        GenerateContentResponse response =
                client.models.generateContent(
                        modelName,
                        prompt.toString(),
                        null
                );

        if (response.text() == null || response.text().isBlank()) {
            return "I'm here to help. Could you tell me a bit more?";
        }

        String reply = response.text();

        reply = reply.replace("**", "")
                .replace("* ", "")
                .replace("*", "")
                .trim();

        return reply;
    }

    private String buildSystemPrompt(String topicCode) {
        String topic = topicCode == null ? "" : topicCode.trim().toUpperCase();

        // Each topic gets a slightly different support style so replies stay relevant to that area.
        switch (topic) {
            case "ACADEMIC_STRESS":
                return "You are a supportive academic stress guidance assistant for students. " +
                        "Use the detected emotion and the assessment context to reply with empathy and practical help. " +
                        "Give calm, non-judgmental advice about exams, deadlines, workload, focus, and study planning. " +
                        "Keep replies concise. Do not diagnose medical conditions.";

            case "ANXIETY":
                return "You are a supportive student wellbeing assistant. " +
                        "Use the detected emotion and the assessment context to respond sensitively. " +
                        "Give calm, practical, non-clinical advice for anxiety, stress, and emotional overwhelm. " +
                        "Encourage healthy coping strategies and trusted human support when appropriate. " +
                        "Do not claim to be a therapist or doctor.";

            case "RELATIONSHIPS":
                return "You are a supportive relationship guidance assistant for students. " +
                        "Use the detected emotion and the assessment context to adjust tone and empathy. " +
                        "Give balanced, respectful advice about communication, boundaries, conflict, and misunderstandings.";

            default:
                return "You are a supportive topic-guidance assistant for students. " +
                        "Give clear, practical, empathetic advice.";
        }
    }
}
