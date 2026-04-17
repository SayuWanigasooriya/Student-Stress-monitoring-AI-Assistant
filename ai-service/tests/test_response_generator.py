import asyncio

from logic.decision_logic import ImpactLevel, IndicatorLevel
from logic import response_generator


def test_generate_personalized_response_uses_rich_fallback_when_gemini_is_disabled(monkeypatch):
    monkeypatch.setattr(response_generator, "gemini_enabled", lambda: False)
    monkeypatch.setattr(response_generator, "retrieve_context", lambda _: "Try one grounding exercise tonight.")

    result = asyncio.run(
        response_generator.generate_personalized_response(
            user_message="I have been feeling stressed and tired because of studies lately.",
            emotion_category="distressed",
            impact_level=ImpactLevel.MODERATE.value,
            indicator_level=IndicatorLevel.STABLE.value,
            exact_mood="stressed",
            intensity=4,
            history="stressed (stress 4, energy 2, sleep 2) -> okay (stress 3, energy 3, sleep 3)",
            time_of_day="9:00 PM",
        )
    )

    assert "Feeling stressed around 9:00 PM makes sense" in result["ai_message"]
    assert "Try one grounding exercise tonight." in result["ai_message"]
    assert result["immediate_delivery_ways"] == "Chat response"
    assert "Use the 5-5-5 breathing technique" in result["dashboard_suggestions"]
    assert result["generation_source"] == "fallback"


def test_generate_personalized_response_uses_rich_fallback_when_gemini_request_fails(monkeypatch):
    async def broken_generate_text(prompt: str) -> str:
        raise RuntimeError("503 upstream failure")

    monkeypatch.setattr(response_generator, "gemini_enabled", lambda: True)
    monkeypatch.setattr(response_generator, "generate_text", broken_generate_text)
    monkeypatch.setattr(response_generator, "retrieve_context", lambda _: "")

    result = asyncio.run(
        response_generator.generate_personalized_response(
            user_message="I have been feeling stressed and tired because of studies lately.",
            emotion_category="distressed",
            impact_level=ImpactLevel.MODERATE.value,
            indicator_level=IndicatorLevel.STABLE.value,
            exact_mood="stressed",
            intensity=4,
            history="stressed (stress 4, energy 2, sleep 2) -> okay (stress 3, energy 3, sleep 3)",
            time_of_day="9:00 PM",
        )
    )

    assert "temporarily experiencing difficulties" not in result["ai_message"]
    assert "Feeling stressed around 9:00 PM makes sense" in result["ai_message"]
    assert result["generation_source"] == "fallback"
