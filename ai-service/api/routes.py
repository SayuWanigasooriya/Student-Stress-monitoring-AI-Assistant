from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from logic.decision_logic import (
    calculate_wellbeing_impact,
    categorize_emotions,
    determine_indicator_level,
)
from logic.response_generator import (
    generate_chat_response,
    generate_personalized_response,
)


router = APIRouter()


class InteractionRequest(BaseModel):
    user_message: str
    detected_emotions: List[str]
    mental_status: List[str]
    intensity: int = 3
    history: str = "Unknown"
    time_of_day: str = "Unknown"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    ai_response: str


class InteractionResponse(BaseModel):
    emotion_category: str
    wellbeing_impact: str
    indicator_level: str
    ai_response: dict


@router.post("/generate", response_model=InteractionResponse)
async def generate_interaction(req: InteractionRequest):
    emotion_category = categorize_emotions(req.detected_emotions)
    indicator_level = determine_indicator_level(req.mental_status)
    wellbeing_impact = calculate_wellbeing_impact(emotion_category, indicator_level)

    ai_response = await generate_personalized_response(
        user_message=req.user_message,
        emotion_category=emotion_category,
        impact_level=wellbeing_impact,
        indicator_level=indicator_level,
        exact_mood=req.detected_emotions[0] if req.detected_emotions else "Unknown",
        intensity=req.intensity,
        history=req.history,
        time_of_day=req.time_of_day,
    )

    return InteractionResponse(
        emotion_category=emotion_category,
        wellbeing_impact=wellbeing_impact,
        indicator_level=indicator_level,
        ai_response=ai_response,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    messages_dicts = [{"role": m.role, "content": m.content} for m in req.messages]
    response = await generate_chat_response(messages_dicts)
    return ChatResponse(ai_response=response)
