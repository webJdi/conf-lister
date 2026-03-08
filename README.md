# Conf-Lister

**Oil & Gas Conference & Award Tracker** — A full-stack application that scrapes the internet for technical conferences and awards in Digital Transformation, AI/ML from the Oil & Gas sector.

## Architecture

```
conf-lister/
├── backend/          # Python FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # Environment configuration
│   │   ├── auth.py          # Firebase token authentication
│   │   ├── firebase_client.py   # Firebase Admin SDK setup
│   │   ├── models.py        # Pydantic models
│   │   ├── routes.py        # API endpoints
│   │   ├── scraper.py       # Web scraping engine
│   │   └── services.py      # Firestore data operations
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React (Node.js) frontend
│   ├── src/
│   │   ├── components/      # Layout, PrivateRoute
│   │   ├── contexts/        # AuthContext (Firebase Auth)
│   │   ├── pages/           # Dashboard, ScrapeControl, Login
│   │   ├── services/        # API client
│   │   ├── App.js
│   │   ├── firebase.js      # Firebase config
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Features

- **Firebase Authentication** — Email/password login & signup
- **Web Scraping** — Searches DuckDuckGo + conference listing sites for Oil & Gas tech events
- **Dashboard** — Displays conferences/awards sorted by closest upcoming date
- **Stat Cards** — Total entries, conferences, awards, upcoming events
- **Category Filters** — Filter by conferences or awards
- **Manual Scrape Control** — Add/remove search keywords, set max results per keyword
- **CSV Download** — Export all records
- **CRUD Operations** — Delete entries from the dashboard

## Prerequisites

- Python 3.11+
- Node.js 18+
- Firebase project with:
  - **Authentication** (Email/Password provider enabled)
  - **Cloud Firestore** database
  - **Service account key** (for the backend)

## Setup

### 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in method → Email/Password
3. Create a **Cloud Firestore** database (start in test mode for dev)
4. Go to Project Settings → Service Accounts → Generate New Private Key
5. Save the JSON file as `backend/serviceAccountKey.json`
6. Note your Firebase config values for the frontend

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# Edit .env with your Firebase project ID
# Place serviceAccountKey.json in the backend/ directory

# Run the server
python -m app.main
# or: uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux

# Edit .env.local with your Firebase web app config values

# Start dev server
npm start
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000`.

### 4. First Use

1. Open `http://localhost:3000` in your browser
2. Click **Sign Up** and create an account
3. Navigate to **Scrape Control**
4. Adjust keywords as needed and click **Start Scrape**
5. Visit the **Dashboard** to see results sorted by upcoming date

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/scrape` | Trigger scrape with keywords |
| `GET` | `/api/scrape/status` | Get last scrape status |
| `GET` | `/api/conferences` | List all (sorted by date) |
| `GET` | `/api/conferences/download` | Download as CSV |
| `GET` | `/api/conferences/{id}` | Get single entry |
| `PUT` | `/api/conferences/{id}` | Update entry |
| `DELETE` | `/api/conferences/{id}` | Delete entry |
| `GET` | `/api/stats` | Dashboard statistics |

All `/api/*` endpoints require a Firebase ID token in the `Authorization: Bearer <token>` header.
