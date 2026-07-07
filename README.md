# Stress Monitoring AI Assistant

Student wellbeing support app with guided topic-based assessments, AI-assisted follow-up chat, emotion detection, and daily check-ins.

## What the project does

The app helps students in two connected ways:

- Guided support topics for:
  - `ANXIETY`
  - `ACADEMIC_STRESS`
  - `RELATIONSHIPS`
- Daily mood, stress, energy, and sleep check-ins

After a guided session, the user gets:

- an impact level
- a short summary
- recommendations
- optional follow-up chat support

The chat flow combines:

- conversation history
- guided-session summary
- emotion detection from the Python emotion service
- mental health indicator classification from the Python indicator service
- Gemini-based reply generation with safe fallback behavior

The daily check-in flow stores mood entries and generates:

- AI insights when Gemini is configured
- fallback insight summaries when Gemini is unavailable

## Tech stack

### Frontend

- React
- Vite

Location:

- [frontend](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/frontend)

### Backend

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Validation
- MySQL

Location:

- [backend](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend)

### Emotion Service

- Python 3
- FastAPI
- Uvicorn
- Hugging Face Transformers
- Torch

Location:

- [ml-services/emotion-service](ml-services/emotion-service)

### Indicator Service

- Python 3
- FastAPI
- Uvicorn
- scikit-learn
- NLTK

Location:

- [ml-services/indicator-service](ml-services/indicator-service)

## Project structure

```text
stress-monitoring-ai-assistant/
├── backend/
├── ml-services/
├── frontend/
└── README.md
```

## Core features

- User signup and login
- Topic-based guided support flow
- Rule-based guidance scoring with recommendations
- Follow-up chat support
- Emotion-aware chat response shaping
- Daily check-in entry tracking
- AI insights for daily check-ins with fallback summaries
- Profile management

## Main backend areas

### Guided support flow

- [TopicController.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/controller/TopicController.java)
- [SessionController.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/controller/SessionController.java)
- [GuidedSessionService.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/service/GuidedSessionService.java)
- [GuidanceEngine.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/service/GuidanceEngine.java)

### Chat support

- [ChatController.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/controller/ChatController.java)
- [ChatService.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/service/ChatService.java)
- [EmotionService.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/service/EmotionService.java)
- [GeminiService.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/service/GeminiService.java)

### Daily check-ins

- [MoodEntryController.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/controller/MoodEntryController.java)
- [AIInsightsController.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/controller/AIInsightsController.java)
- [MoodEntry.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/main/java/com/sliit/tg/model/MoodEntry.java)

## Environment configuration

### Frontend

Create `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

Example file:

- [frontend/.env.example](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/frontend/.env.example)

### Backend

Spring Boot does not auto-load `backend/.env`, so export variables in the terminal or configure them in your IDE.

Common backend variables:

```bash
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/stress_monitoring_ai_assistant_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Colombo
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=root123
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
APP_EMOTION_API_URL=http://127.0.0.1:8001/predict
APP_INDICATOR_API_URL=http://127.0.0.1:8002/predict
APP_GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_key_here
```

Example file:

- [backend/.env.example](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/.env.example)

Notes:

- `GEMINI_API_KEY` is optional for app startup.
- Guided chat and daily insights still run with fallback behavior when Gemini is unavailable.
- The emotion service is expected at `http://127.0.0.1:8001/predict`.
- The indicator service is expected at `http://127.0.0.1:8002/predict`.

## Prerequisites

- Node.js and npm
- Java 17
- Maven
- MySQL
- Python 3

## How to run the project

### 1. Create the database

Run this in MySQL:

```sql
CREATE DATABASE stress_monitoring_ai_assistant_db;
```

### 2. Start the emotion service

```bash
cd ml-services/emotion-service
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

### 3. Start the indicator service

```bash
cd ml-services/indicator-service
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8002 --reload
```

### 4. Start the backend

```bash
cd /Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend
export SERVER_PORT=8080
export SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/stress_monitoring_ai_assistant_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Colombo'
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=root123
export APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
export APP_EMOTION_API_URL=http://127.0.0.1:8001/predict
export APP_INDICATOR_API_URL=http://127.0.0.1:8002/predict
export APP_GEMINI_MODEL=gemini-2.5-flash
export GEMINI_API_KEY=your_key_here
mvn spring-boot:run
```

Backend URL:

- [http://localhost:8080](http://localhost:8080)

### 5. Start the frontend

```bash
cd /Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/frontend
npm install
npm run dev
```

Frontend URL:

- [http://localhost:5173](http://localhost:5173)

## Testing and verification

### Backend tests

Run:

```bash
cd /Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend
mvn test
```

Current backend unit tests cover:

- [GuidanceEngineTest.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/test/java/com/sliit/tg/service/GuidanceEngineTest.java)
- [GuidedSessionServiceTest.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/test/java/com/sliit/tg/service/GuidedSessionServiceTest.java)
- [ChatServiceTest.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/test/java/com/sliit/tg/service/ChatServiceTest.java)
- [AIInsightsControllerTest.java](/Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/backend/src/test/java/com/sliit/tg/controller/AIInsightsControllerTest.java)

These tests focus on:

- guidance scoring behavior
- guided session progression and completion
- chat message persistence and AI reply flow
- daily check-in insight fallback behavior

### Frontend checks

Run:

```bash
cd /Users/sandarunipuna/Documents/Projects/stress-monitoring-ai-assistant/frontend
npm run lint
npm run build
```

## API highlights

### Topics and guided sessions

- `GET /topics`
- `POST /topics/{id}/start`
- `POST /sessions/{sessionId}/answer`

### Users

- `POST /api/users/signup`
- `POST /api/users/login`
- `GET /api/users/{id}`
- `PUT /api/users/{id}`

### Chat

- `POST /api/chat/session`
- `POST /api/chat/message`
- `GET /api/chat/session/{sessionId}/messages`

### Daily check-ins

- `POST /api/mood-entries`
- `GET /api/mood-entries?userId={id}`
- `GET /api/ai-insights?userId={id}`

## Current limitations

- Authentication is still basic and should be upgraded with password hashing and stronger auth handling.
- The emotion service, indicator service, and Gemini integration depend on external services and credentials.
- Daily check-in insights are partly fallback-driven when Gemini is unavailable.
- Frontend state is still centralized in `App.jsx` and can be refactored further.

## Suggested next improvements

- Add password hashing and stronger authentication
- Add more backend tests and controller-level API tests
- Add trend charts for daily check-ins
- Refactor frontend screen/state structure
- Add screenshots and demo evidence for project submission
