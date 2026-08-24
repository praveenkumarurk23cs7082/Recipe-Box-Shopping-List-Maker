# Recipe Box & Shopping List — Backend Skeleton (Role #1)

FastAPI + SQLAlchemy + Alembic skeleton for the `recipes` CRUD API and the
shared DB schema (`recipes`, `recipe_ingredients`, `shopping_list_items`).
SQLite locally, Postgres (Cloud SQL) in the deployed app — same code, only
`DATABASE_URL` changes.

This has already been run end-to-end locally (migration applied, server
started, a recipe created and fetched back) — it works out of the box.

## 1. First-time setup

```bash
cd recipe-box-backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # defaults to SQLite, no edits needed locally
```

## 2. Create the database

```bash
alembic upgrade head
```

This creates `recipe_box.db` (SQLite) with all three tables. Whenever you
change `app/models.py`, generate a new migration instead of hand-editing the DB:

```bash
alembic revision --autogenerate -m "short description of the change"
alembic upgrade head
```

Commit the generated file in `alembic/versions/` — that's how schema changes
travel to every teammate's machine and to Cloud SQL.

## 3. Run the API

```bash
uvicorn app.main:app --reload
```

Open **http://127.0.0.1:8000/docs** — interactive Swagger UI. This is the
"API contract" the handout mentions: point #4, #5, #6 here so they can build
against real endpoints without waiting on you to explain anything.

Quick manual test:

```bash
curl -X POST http://127.0.0.1:8000/recipes \
  -H "Content-Type: application/json" \
  -d '{
        "title": "Pancakes",
        "category": "breakfast",
        "prep_time_min": 15,
        "base_servings": 4,
        "ingredient_lines": ["2 cups flour", "2 eggs", "a pinch of salt", "1/2 cup milk"]
      }'
```

## 4. Project layout

```
app/
  main.py              FastAPI app, CORS, /health
  config.py             Reads DATABASE_URL from env (.env locally)
  database.py            Engine/session setup, get_db() dependency
  models.py               SQLAlchemy models: Recipe, RecipeIngredient, ShoppingListItem
  schemas.py                Pydantic request/response shapes
  routers/recipes.py         POST/GET/PUT/DELETE /recipes
  services/ingredient_parser.py   PLACEHOLDER parser — #2 replaces this
alembic/                      Migration environment + versions/
```

### Why `services/ingredient_parser.py` exists in Role #1's skeleton

The `/recipes` endpoint needs *something* to turn `"2 cups flour"` into
`(quantity, unit, name)` on day one, or #4/#5 can't build against it. The
included parser handles the simple `"<qty> <unit> <name>"` and `"<qty> <name>"`
patterns and falls back to `quantity=None` for anything else (e.g. "salt to
taste"). **#2 owns this file** — same function signature
(`parse_ingredient_line(line: str) -> dict`), so swapping in the real,
tested parser is a drop-in replacement, not a rewrite of the router.

## 5. Switching to Cloud SQL (once #7 has it ready)

No code changes — just set the env var (Cloud Run: via Secret Manager):

```
DATABASE_URL=postgresql://USER:PASSWORD@/DBNAME?host=/cloudsql/PROJECT:REGION:INSTANCE
```

Then run `alembic upgrade head` once against that URL to create the tables
in Postgres too.

## 6. Git workflow (per the team handout)

```bash
git checkout develop
git pull origin develop
git checkout -b feature/1-backend-skeleton
git add .
git commit -m "Add FastAPI skeleton, DB models, Alembic migrations, recipes CRUD"
git push origin feature/1-backend-skeleton
# Open a PR: feature/1-backend-skeleton -> develop
```

Push early, in small commits — #2, #3, #4, #6, #8 are all blocked until this
lands in `develop`.

## 7. Your done-checklist

- [x] Recipe CRUD works end-to-end against a real DB (not in-memory) — verified above.
- [x] Schema matches the shared data model exactly (quantity/unit/name split, not one text field).
