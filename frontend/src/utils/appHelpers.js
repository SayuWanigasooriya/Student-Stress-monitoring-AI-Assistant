export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function getFriendlyMessage(error, fallback) {
    const message = error?.message || "";

    if (message.includes("Failed to fetch") || message.includes("Load failed")) {
        return "We couldn't reach the server right now. Please check that the backend is running and try again.";
    }

    return message || fallback;
}

export function getAnswerValue(question, answers) {
    if (!question) return "";

    if (question.type === "MCQ" || question.type === "YES_NO") {
        return answers.selectedAnswer;
    }

    if (question.type === "TEXT") {
        return answers.textAnswer.trim();
    }

    if (question.type === "SCALE") {
        return String(answers.scaleAnswer);
    }

    return "";
}

export function createSupportIntroMessage() {
    return { sender: "bot", message: "I'm here with you. We can keep working through this together.", source: "system" };
}
