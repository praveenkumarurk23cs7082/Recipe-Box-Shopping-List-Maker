# Recipe Box & Shopping List Maker

A personal recipe repository that turns the ingredients of any selected recipes into a single, deduplicated shopping checklist — built for the Cognizant Hackathon (Use Case 4) on Google Cloud Platform.

**Live app:** https://recipe-shopping-mvp.web.app

## What it does

- Save recipes with title, category, prep time, servings, and ingredients (one per line, or scanned from a photo).
- Scale any recipe 1x / 2x / 4x — ingredient quantities recalculate live.
- Add a recipe's (scaled) ingredients to your shopping list — items with the same name and unit are **consolidated**, not duplicated.
- Check items off while shopping; state is saved, not just local.
- Sign in with Google — every user's recipes and shopping list are private to their account.

## Tech stack

- **Backend:** FastAPI + SQLAlchemy + Alembic, deployed on Cloud Run
- **Database:** PostgreSQL via Cloud SQL (SQLite for local dev — same code, only `DATABASE_URL` changes)
- **Frontend:** Vanilla HTML/CSS/JS, deployed on Firebase Hosting (deliberately no framework/build step)
- **Auth:** Firebase Authentication (Google Sign-In), verified server-side via `firebase-admin`
- **Other GCP services:** Cloud Storage (recipe photo uploads), Vision AI + Natural Language API (scan a recipe photo to auto-fill ingredients), Cloud Build (CI/CD on push to `develop`), Artifact Registry, Secret Manager

## Local development setup

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # defaults to SQLite, no edits needed locally
alembic upgrade head
uvicorn app.main:app --reload
```

Open `frontend/index.html` directly in a browser (or serve it), and update `API_BASE` in `frontend/app.js` to `http://127.0.0.1:8000` for local testing against a local backend.

## Seed data

```bash
python seed.py
```

Populates sample recipes across all three categories. Safe to run multiple times — skips recipes whose title already exists.

## Tests

```bash
pytest tests/
```

## Deployment

- **Backend:** Cloud Build auto-deploys to Cloud Run on every push to `develop` (see `cloudbuild.yaml`).
- **Frontend:** manual deploy via `firebase deploy --only hosting` (not yet wired to auto-deploy on push).

See `demo_script.md` and `limitations_slide.md` for the presentation walkthrough and known scope limitations.
