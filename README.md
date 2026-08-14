# QET AI Execution Engine & React Spec-Kit

Autonomous Quality and Test Execution Platform featuring a React-first Home & Understanding flow backed by a FastAPI runtime engine.

## 🚀 Features Implemented (F01 - F06)
- **F01 Home Upload Experience**: React UI with drag-and-drop cards for requirement documents (`.md`, `.pdf`, `.txt`, `.docx`) and codebase ZIP archives (`.zip`).
- **F02 Understanding AI Engine**: AI-required understanding generator with explicit fail-fast diagnostics on missing API key, timeout, or malformed JSON (no fake fallback content).
- **F03 FastAPI Runtime Layer**: REST API contract exposing `/api/v1/runs`, `/documents`, `/codebase`, `/status`, `/understanding/start`, `/understanding`.
- **F04 Run State Persistence**: Complete state machine tracking (`idle` → `uploading` → `processing_zip` → `indexing` → `ai_understanding_running` → `understanding_ready` / `error`).
- **F05 UX Observability & Provenance**: Live lifecycle progress timeline, AI provenance metadata badge box, and actionable error surfaces with retry buttons.
- **F06 Quality Gates & Tests**: 63+ automated pytest test cases covering API contracts, fail-fast behavior, and state transitions.

---

## 🛠️ Repository Structure

```
qet-react-ui/
├── backend/                   # Python FastAPI Runtime & AI Specialist Agents
│   ├── app.py                 # Original Streamlit app (intact & operational)
│   ├── requirements.txt       # Python dependencies
│   ├── schemas/               # Contract models & AppState schemas
│   ├── src/
│   │   ├── agents/            # AI Specialist Agents (Understanding, Test Case, etc.)
│   │   ├── api/               # FastAPI Runtime server (fastapi_app.py)
│   │   └── services/          # Run state persistence & ZIP intake services
│   └── tests/                 # Pytest automated test suite (test_fastapi_app.py)
├── src/                       # React + Vite + TypeScript Frontend Application
│   ├── components/            # NavigationHeader, HomeUploadPage, UnderstandingPage
│   ├── services/              # apiClient.ts
│   ├── types.ts               # TypeScript data models
│   ├── App.tsx                # App shell & polling engine
│   └── index.css              # Glassmorphism & dark theme styles
├── specs/                     # Feature-Driven Spec Kit (002-feature-driven-spec-kit)
├── index.html                 # React web template
├── package.json               # Node.js dependencies
└── README.md
```

---

## 🚦 Quick Start Guide

### 1. Run FastAPI Backend
```powershell
cd backend
python -m uvicorn src.api.fastapi_app:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000/api/v1`
- Built-in React Web App: `http://127.0.0.1:8000`

### 2. Run React Frontend (Dev Server)
```powershell
npm install
npm run dev
```
App running at `http://localhost:5173`.

### 3. Run Automated Tests
```powershell
cd backend
python -m pytest
```

---

## 🌿 Git Branching Strategy

- **`main`**: Production baseline branch containing the verified release of F01-F06.
- **Feature Branches**: Create feature branches (`feature/your-feature-name`) for new contributions and submit Pull Requests to `main`.
