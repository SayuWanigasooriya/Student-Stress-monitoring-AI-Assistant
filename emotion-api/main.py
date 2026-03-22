from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

classifier = pipeline(
    "text-classification",
    model="michelleli99/emotion_text_classifier",
    top_k=1
)

class EmotionRequest(BaseModel):
    text: str

@app.post("/predict-emotion")
def predict_emotion(request: EmotionRequest):
    result = classifier(request.text)[0][0]
    return {
        "emotion": result["label"],
        "score": float(result["score"])
    }