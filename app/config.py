import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """
    Central place for env-driven config.
    Local dev: DATABASE_URL defaults to SQLite (zero setup).
    Deployed (Cloud Run): #7 sets DATABASE_URL to the Cloud SQL Postgres
    connection string via Secret Manager / env var — no code change needed.
    """
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recipe_box.db").strip()
    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME", "recipe-shopping-mvp-images").strip()


settings = Settings()