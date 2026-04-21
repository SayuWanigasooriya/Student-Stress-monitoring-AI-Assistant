from __future__ import annotations

from pathlib import Path

import joblib


MODEL_DIR = Path(__file__).resolve().parents[1] / "data"
MODEL_PATH = MODEL_DIR / "mental_health_status_model.joblib"
LABELS_PATH = MODEL_DIR / "mental_health_status_labels.joblib"

_model = None
_labels = None


class MentalHealthModelUnavailable(RuntimeError):
    pass


def model_available() -> bool:
    return MODEL_PATH.exists() and LABELS_PATH.exists()


def _load():
    global _model, _labels
    if _model is None or _labels is None:
        if not model_available():
            raise MentalHealthModelUnavailable("Mental health model artifacts are missing.")
        _model = joblib.load(MODEL_PATH)
        _labels = joblib.load(LABELS_PATH)
    return _model, _labels


def predict_statement(statement: str) -> dict:
    model, labels = _load()
    text = (statement or "").strip()
    if not text:
        raise ValueError("Statement must not be empty.")

    probabilities = model.predict_proba([text])[0]
    best_index = max(range(len(probabilities)), key=lambda index: probabilities[index])
    status = labels[best_index]
    confidence = float(probabilities[best_index])

    top_classes = sorted(
        (
            {"label": labels[index], "score": float(score)}
            for index, score in enumerate(probabilities)
        ),
        key=lambda item: item["score"],
        reverse=True,
    )[:3]

    return {
        "status": status,
        "confidence": confidence,
        "top_classes": top_classes,
        "source": "mental_health_status_model",
    }
