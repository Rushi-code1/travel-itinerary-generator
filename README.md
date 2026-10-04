# ✈️ RoamAI — Intelligent Travel Itinerary & Trip Planner

> An automated AI travel planning platform that generates personalized, multi-day itineraries and destination recommendations using Django, Celery, Redis, and Google Gemini — paired with an interactive React.js interface.

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-5.4-37814A?logo=celery&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?logo=redis&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-1.5%20Pro-4285F4?logo=google-gemini&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![License](https://img.shields.io/badge/License-MIT-success)

---

## 🚀 Features

- **Personalized Multi-Day Schedules** — Generates complete itineraries customized by travel dates, budget tier, pace, and interests.
- **Celery Async Task Queues** — Decouples long-running LLM generation into background worker jobs, keeping user requests instant and non-blocking.
- **Geographic Clustering & Pacing** — Groups daily activities geographically to minimize travel time and optimize sightseeing flow.
- **Live Task Status Polling** — Frontend polls Celery task states in real-time with visual loading indicators and instant rendering upon completion.
- **Redis Response Caching** — Caches destination metadata and popular travel queries to minimize latency and API consumption.
- **Interactive Day-by-Day Cards** — Modular UI cards displaying morning, afternoon, and evening recommendations with dining spots.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend API** | Django 5.1, DRF | REST endpoints, itinerary persistence, auth |
| **Task Queue** | Celery 5.4, Redis | Asynchronous background workers |
| **AI / Generation**| Google Gemini 1.5 Pro | Multi-shot itinerary generation |
| **Frontend** | React 19, Tailwind CSS | Trip form, status polling, itinerary cards |
| **Database** | SQLite / PostgreSQL | Saved itineraries & user profiles |

---

## ⚡ Quick Start

```bash
git clone https://github.com/Rushi-code1/travel-itinerary-generator.git
cd travel-itinerary-generator

# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate

# Start Celery & Redis
celery -A core worker --loglevel=info
python manage.py runserver

# Frontend
cd ../frontend
npm install
npm run dev
```

---

## 👨‍💻 Author & Connect

**Rushikesh Deshmukh**  
*Full Stack Developer & AI Engineer*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Rushikesh_Deshmukh-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/rushikesh-sunil-deshmukh)
[![GitHub](https://img.shields.io/badge/GitHub-Rushi--code1-181717?logo=github&logoColor=white)](https://github.com/Rushi-code1)
[![Portfolio](https://img.shields.io/badge/Portfolio-Live_Site-6366F1?logo=google-chrome&logoColor=white)](https://rushi-code1.github.io/portfolio2/)
[![Email](https://img.shields.io/badge/Email-rushikesh.deshmukh1103%40gmail.com-EA4335?logo=gmail&logoColor=white)](mailto:rushikesh.deshmukh1103@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
