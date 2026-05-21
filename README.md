# SkillGraph

AI-powered campus placement platform (backend: FastAPI, frontend: Next.js).

Quick start (local):

1. Create and activate Python venv and install backend deps:

```powershell
Set-Location ..
.\.venv\Scripts\Activate.ps1
pip install -r skillgraph/backend/requirements.txt
```

2. Start backend (development):

```powershell
Set-Location skillgraph/backend
$env:PYTHONPATH=$(Resolve-Path .).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

3. Start frontend (development):

```bash
cd skillgraph/frontend
npm install
npm run dev
# open http://localhost:3000
```

Windows quick start:

```powershell
Set-Location skillgraph
PowerShell -ExecutionPolicy Bypass -File .\run-local.ps1
```

This opens separate PowerShell windows for backend and frontend using the shared workspace venv at `D:\EDI SEM 2\.venv`.

Docker (optional):

```bash
# from repository root
docker-compose up --build
# backend -> http://localhost:8001
# frontend -> http://localhost:3000
```

Notes:
- The backend lazily loads heavy ML models (spaCy, SentenceTransformer, Whisper). To enable Whisper transcription locally, install `whisper` and `ffmpeg` manually. Example:

```powershell
pip install -U openai-whisper
# ensure ffmpeg is available on PATH (install via choco or apt)
```

- The frontend default API base is `http://127.0.0.1:8001/api/v1`. Change `NEXT_PUBLIC_API_URL` to override.

What's done so far:
- Backend routes stabilized and lazy-loaded ML proxies implemented.
- Frontend wired to backend (port 8001).
- Dockerfiles and `docker-compose.yml` updated to include backend and frontend services.
- Smoke tests for core endpoints (`/student/resume/analyze_text`, `/company/candidates/rank`, `/student/interview/grade`) verified.

Developer utilities:

- Seed the Neo4j knowledge graph (script provided):

```powershell
Set-Location skillgraph/ml
python scripts/seed_knowledge_graph.py
```

- Seed Postgres DB with minimal sample data (run after Postgres is up and .env configured):

```powershell
Set-Location skillgraph/backend
$env:PYTHONPATH=$(Resolve-Path .).Path
python scripts/seed_db.py
```


```powershell
Set-Location skillgraph/backend
python scripts/test_whisper.py
curl.exe -F "audio=@test_tone.wav" http://127.0.0.1:8001/api/v1/student/interview/transcribe

Production & Docker

To run the production-ready compose (build images and run services):

```bash
docker compose -f docker-compose.prod.yml up --build
```

Use `docker compose down` to stop and remove containers.

Continuous Integration
----------------------

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` which:
- runs backend tests
- builds the frontend
- includes a placeholder for e2e smoke steps (requires a deployed/staging backend)

Next steps you can ask me to run:
- Integrate Whisper locally and enable transcription end-to-end.
- Seed Neo4j and Postgres with sample data and add tests.
- Add GitHub Actions CI and unit tests.
- Polish frontend styling and complete feature wiring.
