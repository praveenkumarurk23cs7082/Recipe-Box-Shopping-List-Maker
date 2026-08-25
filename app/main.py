from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import recipes, scan, shopping_list, upload

app = FastAPI(title="Recipe Box & Shopping List API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # fine for a hackathon; #7 can tighten this before the demo if time allows
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipes.router)
app.include_router(shopping_list.router)
app.include_router(scan.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}