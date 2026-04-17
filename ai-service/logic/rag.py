import math
import re
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

from logic.gemini_api import embed_query, embed_texts, gemini_enabled


load_dotenv()


KNOWLEDGE_BASE_PATH = Path(__file__).resolve().parent.parent / "data" / "knowledge_base.txt"


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z']+", text.lower()))


@lru_cache(maxsize=1)
def _load_chunks() -> list[str]:
    if not KNOWLEDGE_BASE_PATH.exists():
        return []

    raw_text = KNOWLEDGE_BASE_PATH.read_text(encoding="utf-8").strip()
    if not raw_text:
        return []

    return [chunk.strip() for chunk in raw_text.split("\n\n") if chunk.strip()]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return -1.0

    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    if mag_a == 0.0 or mag_b == 0.0:
        return -1.0
    return dot / (mag_a * mag_b)


def _retrieve_with_keywords(query: str, chunks: list[str], top_k: int) -> list[str]:
    query_tokens = _tokenize(query)
    ranked = []
    for chunk in chunks:
        overlap = len(query_tokens & _tokenize(chunk))
        ranked.append((overlap, chunk))

    ranked.sort(key=lambda item: item[0], reverse=True)
    return [chunk for score, chunk in ranked[:top_k] if score > 0]


def _retrieve_with_embeddings(query: str, chunks: list[str], top_k: int) -> list[str]:
    query_embedding = embed_query(query)
    chunk_embeddings = embed_texts(chunks)

    ranked = []
    for chunk, embedding in zip(chunks, chunk_embeddings):
        ranked.append((_cosine_similarity(query_embedding, embedding), chunk))

    ranked.sort(key=lambda item: item[0], reverse=True)
    return [chunk for score, chunk in ranked[:top_k] if score > 0]


def retrieve_context(query: str, top_k: int = 2) -> str:
    if not query or not query.strip():
        return ""

    chunks = _load_chunks()
    if not chunks:
        return ""

    try:
        if gemini_enabled():
            matches = _retrieve_with_embeddings(query, chunks, top_k)
        else:
            matches = _retrieve_with_keywords(query, chunks, top_k)
    except Exception:
        matches = _retrieve_with_keywords(query, chunks, top_k)

    return "\n\n".join(matches)
