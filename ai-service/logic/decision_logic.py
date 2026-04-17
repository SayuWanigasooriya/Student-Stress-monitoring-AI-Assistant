from enum import Enum


class EmotionCategory(str, Enum):
    POSITIVE = "positive"
    BALANCED = "balanced"
    DISTRESSED = "distressed"
    UNKNOWN = "unknown"


class IndicatorLevel(str, Enum):
    STABLE = "stable"
    WATCH = "watch"
    ELEVATED = "elevated"


class ImpactLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


POSITIVE_EMOTIONS = {"happy", "joy", "joyful", "motivated", "grateful", "calm", "relaxed"}
BALANCED_EMOTIONS = {"okay", "ok", "neutral", "fine", "steady", "content"}
DISTRESSED_EMOTIONS = {
    "stressed",
    "stress",
    "anxious",
    "anxiety",
    "sad",
    "angry",
    "overwhelmed",
    "tired",
    "fear",
    "worried",
    "depressed",
    "lonely",
}


def categorize_emotions(detected_emotions: list[str]) -> str:
    normalized = {emotion.strip().lower() for emotion in detected_emotions if emotion and emotion.strip()}
    if not normalized:
        return EmotionCategory.UNKNOWN.value
    if normalized & DISTRESSED_EMOTIONS:
        return EmotionCategory.DISTRESSED.value
    if normalized & POSITIVE_EMOTIONS:
        return EmotionCategory.POSITIVE.value
    if normalized & BALANCED_EMOTIONS:
        return EmotionCategory.BALANCED.value
    return EmotionCategory.UNKNOWN.value


def determine_indicator_level(mental_status: list[str]) -> str:
    normalized = {status.strip().lower() for status in mental_status if status and status.strip()}
    if not normalized:
        return IndicatorLevel.STABLE.value

    elevated_terms = {
        "panic",
        "anxiety",
        "depression",
        "depressed",
        "burnout",
        "overwhelmed",
        "distressed",
        "hopeless",
    }
    watch_terms = {
        "stressed",
        "stress",
        "low mood",
        "fatigue",
        "tired",
        "restless",
        "worried",
    }

    if normalized & elevated_terms:
        return IndicatorLevel.ELEVATED.value
    if normalized & watch_terms:
        return IndicatorLevel.WATCH.value
    return IndicatorLevel.STABLE.value


def calculate_wellbeing_impact(emotion_category: str, indicator_level: str) -> str:
    if indicator_level == IndicatorLevel.ELEVATED.value:
        return ImpactLevel.HIGH.value
    if emotion_category == EmotionCategory.DISTRESSED.value or indicator_level == IndicatorLevel.WATCH.value:
        return ImpactLevel.MODERATE.value
    return ImpactLevel.LOW.value
