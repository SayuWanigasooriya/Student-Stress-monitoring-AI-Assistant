import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router


app = FastAPI(
    title="Emotion-Aware AI Service",
    description="Microservice for emotion-aware response generation and personalization",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Emotion-Aware AI Service.",
        "documentation": "Visit /docs for API documentation.",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/mental-health/health")
def mental_health_health():
    from logic.mental_health_model import model_available

    return {"status": "ok" if model_available() else "missing_model"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
