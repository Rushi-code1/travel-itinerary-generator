# AI-Powered Smart Travel Itinerary Generator

An asynchronous, AI-driven travel planning application that automatically drafts detailed day-by-day travel itineraries based on destination, budget, duration, and preferences using Celery tasks and the Google Gemini 1.5 API.

## Technical Architecture

* **Backend**: Django 5.1, Django REST Framework (DRF), Celery 5.4, Redis (as broker & backend), psycopg2-binary, Google Generative AI Python SDK.
* **Frontend**: React (Vite), Recharts (responsive PieChart for budget details), Lucide Icons, custom glassmorphism styles.
* **Database**: PostgreSQL (Itinerary records, user profiles).
* **Broker & Queue**: Redis server.

---

## Core Features

1. **Non-blocking Creation**: Trippers submit itinerary queries through a `POST` request. The API registers the request as `PENDING`, delegates execution to a Celery background worker, and returns a quick response immediately.
2. **Dual-mode Generation (API Key & Mock Fallback)**:
   - If a `GEMINI_API_KEY` is present in the environment, the worker requests structured JSON directly from the Gemini API using `response_mime_type: "application/json"`.
   - If no API key is set, the worker falls back to a highly realistic mock itinerary generator. This ensures the app is immediately testable out-of-the-box!
3. **Budget Analytics**: In the frontend, users view a Recharts Pie Chart representing a detailed breakdown of flights, hotels, and activities against their budget.
4. **Visual Timeline**: Day-by-day activities mapped out with times, descriptions, costs, and locations.
5. **Mock GPS Route**: Visual route points showing simulated geolocation coordinates for activities.

---

## Installation & Running

### Prerequisites
* Python 3.10+
* Node.js (with npm)
* Redis Server (running on default port `6379`)
* PostgreSQL (database `travel_itinerary_generator`)

### 1. Run the Backend
1. Open a terminal in `backend/`.
2. Configure environment (set `GEMINI_API_KEY` if you have one, otherwise fallbacks are active).
3. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
4. Start the Django API server:
   ```bash
   python manage.py runserver
   ```
5. In another terminal, start the Celery background worker:
   ```bash
   python -m celery -A travel_project worker --loglevel=info
   ```
6. Run the automated PyTest suite to verify operations:
   ```bash
   python -m pytest
   ```

### 2. Run the Frontend
1. Open a terminal in `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the browser to `http://localhost:5173`.
