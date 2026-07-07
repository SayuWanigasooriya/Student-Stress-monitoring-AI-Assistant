from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import pipeline
from threading import Lock
import logging
import os
import traceback

os.environ["TOKENIZERS_PARALLELISM"] = "false"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("emotion-service")

app = FastAPI(
    title="Emotion Classifier Service",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

MODEL_ID = "michelleli99/emotion_text_classifier"

clf = None
clf_lock = Lock()

class Req(BaseModel):
    text: str = Field(..., min_length=1)

@app.on_event("startup")
def load_model():
    global clf
    try:
        logger.info("Loading emotion model: %s", MODEL_ID)
        clf = pipeline("text-classification", model=MODEL_ID)
        logger.info("Emotion model loaded successfully")
    except Exception:
        logger.exception("Failed to load emotion model")
        raise

def normalize_output(out):
    if out is None:
        return []

    if isinstance(out, dict):
        if "label" in out and ("score" in out or "confidence" in out):
            return [{
                "label": out.get("label"),
                "score": float(out.get("score", out.get("confidence", 0.0)))
            }]
        return []

    if isinstance(out, list):
        if not out:
            return []

        if isinstance(out[0], list):
            inner = out[0]
            return [
                {"label": d["label"], "score": float(d["score"])}
                for d in inner
                if isinstance(d, dict) and "label" in d and "score" in d
            ]

        if isinstance(out[0], dict):
            return [
                {"label": d["label"], "score": float(d["score"])}
                for d in out
                if isinstance(d, dict) and "label" in d and "score" in d
            ]

        if isinstance(out[0], str):
            return [{"label": out[0], "score": 1.0}]

    if isinstance(out, str):
        return [{"label": out, "score": 1.0}]

    return []

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": clf is not None,
        "model_id": MODEL_ID
    }

@app.post("/predict")
def predict(req: Req):
    try:
        text = req.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="text must not be blank")

        logger.info("EMOTION request received: %s", text[:100])

        with clf_lock:
            out = clf(text)

        scores = normalize_output(out)
        if not scores:
            raise RuntimeError(f"Unexpected model output format: type={type(out)} value={str(out)[:300]}")

        best = max(scores, key=lambda d: d["score"])
        return {
            "emotion": str(best["label"]),
            "score": float(best["score"])
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Prediction failed: %s", str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
