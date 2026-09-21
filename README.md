# 🌍 Travel Itinerary Generator

> An **AI-powered travel planning platform** that generates personalized multi-day itineraries using Django DRF, Celery background tasks, Redis, and Google Gemini — with a React.js frontend for seamless travel planning.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.x-green?logo=django)](https://djangoproject.com)
[![Celery](https://img.shields.io/badge/Celery-5.x-37814A?logo=celery)](https://docs.celeryq.dev)
[![Redis](https://img.shields.io/badge/Redis-7.x-red?logo=redis)](https://redis.io)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-AI-blue?logo=google)](https://deepmind.google/gemini)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

---

## 🚀 Features

- **AI Itinerary Generation** — Generates personalized day-by-day travel plans using Google Gemini
- **Async Task Processing** — Celery workers handle long-running AI generation without blocking the API
- **Real-Time Status Polling** — Frontend polls task status via REST API until itinerary is ready
- **Redis Task Queue** — Reliable task brokering and result caching with Redis
- **Django REST Framework** — Robust, versioned REST API with serializers and viewsets
- **React.js Frontend** — Interactive UI to input preferences and view generated itineraries
- **Customizable Plans** — Supports budget, duration, travel style, and destination preferences

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Django 4.x, Django REST Framework |
| **Task Queue** | Celery 5.x |
| **Broker / Cache** | Redis 7 |
| **AI / LLM** | Google Gemini API |
| **Frontend** | React.js 18 |
| **Auth** | JWT (djangorestframework-simplejwt) |
| **Deployment** | Docker, Docker Compose |

---

## 🏗️ Architecture

```
┌──────────────┐    REST API     ┌─────────────────────┐
│  React.js UI │ ──────────────► │  Django REST API     │
│  (Plan Form) │ ◄── Task ID ─── │  (DRF ViewSets)      │
└──────┬───────┘                 └──────────┬───────────┘
       │ Poll /task/{id}                    │ Enqueue
       │                         ┌──────────▼──────────┐
       │                         │   Redis Task Queue   │
       │                         └──────────┬───────────┘
       │                                    │ Execute
       │                         ┌──────────▼──────────┐
       │                         │   Celery Worker      │
       │                         │  (tasks.py)          │
       │                         └──────────┬───────────┘
       │                                    │ Call
       │                         ┌──────────▼──────────┐
       └─────── Itinerary ────── │   Google Gemini API  │
                                 └─────────────────────┘
```

---

## 📁 Project Structure

```
travel-itinerary-generator/
├── backend/
│   ├── itinerary/
│   │   ├── tasks.py            # Celery async tasks (AI generation)
│   │   ├── views.py            # DRF ViewSets and API logic
│   │   ├── serializers.py      # DRF serializers
│   │   ├── models.py           # Trip, Itinerary, Day models
│   │   └── urls.py             # API URL routing
│   ├── config/
│   │   ├── celery.py           # Celery app configuration
│   │   └── settings.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # TripForm, ItineraryView, StatusPoller
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis 7+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- Docker & Docker Compose (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/Rushi-code1/travel-itinerary-generator.git
cd travel-itinerary-generator
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Set GEMINI_API_KEY, REDIS_URL, SECRET_KEY

python manage.py migrate
python manage.py runserver
```

### 3. Start Celery Worker
```bash
# In a separate terminal
celery -A config worker --loglevel=info
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Or Use Docker Compose (Recommended)
```bash
docker-compose up --build
```

---

## 🧪 Running Tests
```bash
cd backend
pytest -v
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/trips/generate/` | Submit trip preferences → returns task ID |
| `GET` | `/api/tasks/{task_id}/` | Poll task status and result |
| `GET` | `/api/trips/{id}/` | Retrieve saved itinerary |
| `POST` | `/auth/token/` | Get JWT access token |

### Example: Generate Itinerary
```bash
curl -X POST http://localhost:8000/api/trips/generate/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Goa, India",
    "duration_days": 5,
    "budget": "medium",
    "travel_style": "adventure"
  }'
```

**Response:**
```json
{
  "task_id": "d5f2a3b1-...",
  "status": "PENDING",
  "poll_url": "/api/tasks/d5f2a3b1-.../"
}
```

**Poll Response (when ready):**
```json
{
  "status": "SUCCESS",
  "itinerary": {
    "destination": "Goa, India",
    "days": [
      {
        "day": 1,
        "title": "Arrival & North Goa Beaches",
        "activities": ["Calangute Beach", "Fort Aguada", "Sunset at Anjuna"]
      }
    ]
  }
}
```

---

## 🔑 Key Implementation Highlights

- **`tasks.py`** — Celery tasks using `@app.task` with retry logic, Gemini API calls, and Redis result storage
- **`views.py`** — DRF `APIView` for trip submission + async task dispatch
- **`celery.py`** — Celery app configured with Redis broker and result backend
- Long-running AI generation is fully **non-blocking** — API returns immediately with a task ID

---

## 👨‍💻 Author

**Rushikesh Sunil Deshmukh**  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://linkedin.com/in/rushikesh-sunil-deshmukh)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-green)](https://rushi-code1.github.io/portfolio2/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?logo=github)](https://github.com/Rushi-code1)

---

## 📄 License
This project is licensed under the MIT License.
