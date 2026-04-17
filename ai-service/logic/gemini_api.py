import os

import httpx


GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = os.getenv("APP_GEMINI_MODEL", "gemini-2.5-flash")
DEFAULT_EMBEDDING_MODEL = os.getenv("APP_GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
GEMINI_DISABLED_VALUES = {"", "mock-key", "mock-key-for-local-testing"}


def get_gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def gemini_enabled() -> bool:
    return get_gemini_api_key() not in GEMINI_DISABLED_VALUES


def _headers() -> dict:
    return {
        "x-goog-api-key": get_gemini_api_key(),
        "Content-Type": "application/json",
    }


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not gemini_enabled():
        raise ValueError("Gemini API key is not configured.")

    embeddings: list[list[float]] = []

    with httpx.Client(timeout=30.0) as client:
        for text in texts:
            response = client.post(
                f"{GEMINI_API_BASE_URL}/models/{DEFAULT_EMBEDDING_MODEL}:embedContent",
                headers=_headers(),
                json={
                    "model": f"models/{DEFAULT_EMBEDDING_MODEL}",
                    "content": {"parts": [{"text": text}]},
                    "taskType": "RETRIEVAL_DOCUMENT",
                },
            )
            response.raise_for_status()
            payload = response.json()
            embeddings.append(payload["embedding"]["values"])

    return embeddings


def embed_query(text: str) -> list[float]:
    if not gemini_enabled():
        raise ValueError("Gemini API key is not configured.")

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f"{GEMINI_API_BASE_URL}/models/{DEFAULT_EMBEDDING_MODEL}:embedContent",
            headers=_headers(),
            json={
                "model": f"models/{DEFAULT_EMBEDDING_MODEL}",
                "content": {"parts": [{"text": text}]},
                "taskType": "RETRIEVAL_QUERY",
            },
        )
        response.raise_for_status()
        payload = response.json()
        return payload["embedding"]["values"]


async def generate_text(prompt: str) -> str:
    if not gemini_enabled():
        raise ValueError("Gemini API key is not configured.")

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GEMINI_API_BASE_URL}/models/{DEFAULT_GEMINI_MODEL}:generateContent",
            headers=_headers(),
            json={
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}],
                    }
                ]
            },
        )
        response.raise_for_status()
        payload = response.json()

    candidates = payload.get("candidates", [])
    if not candidates:
        return ""

    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts if part.get("text")).strip()
