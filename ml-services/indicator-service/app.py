from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os
import re
import nltk
import numpy as np
from scipy.sparse import hstack
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# --- NLTK setup ---
nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)

stemmer = PorterStemmer()
stop_words = set(stopwords.words("english"))

def preprocess(text: str) -> str:
    if not text:
        return ""
    t = text.lower()
    t = re.sub(r"[^a-z\s]", " ", t)
    tokens = nltk.word_tokenize(t)
    tokens = [x for x in tokens if x not in stop_words and len(x) > 1]
    tokens = [stemmer.stem(x) for x in tokens]
    return " ".join(tokens)

def num_features(original_text: str):
    # must match training: num_of_characters + num_of_sentences
    num_chars = len(original_text) if original_text else 0
    num_sents = len(nltk.sent_tokenize(original_text)) if original_text else 0
    return num_chars, num_sents

# --- Load artifacts ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

model = joblib.load(os.path.join(MODEL_DIR, "indicator_model.joblib"))
vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib"))
label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.joblib"))

app = FastAPI(title="Indicator Model Service", version="1.0")

class PredictRequest(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(req: PredictRequest):
    print("INDICATOR REQ RECEIVED:", req)
    original = req.text or ""
    cleaned = preprocess(original)

    # 1) TF-IDF (50000)
    X_tfidf = vectorizer.transform([cleaned])

    # 2) Numeric features (2)
    c, s = num_features(original)
    X_num = np.array([[c, s]], dtype=np.float64)

    # 3) Combine => 50002
    X = hstack([X_tfidf, X_num])

    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    confidence = float(np.max(proba))

    label = label_encoder.inverse_transform([pred])[0]

    return {"label": str(label), "confidence": confidence}