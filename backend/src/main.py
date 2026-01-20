from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import analytics, categories, households, ingredients, receipts, upload
from src.db.engine import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="Kvitteringshvelv",
    description="Norwegian Receipt Vault with grocery intelligence",
    version="0.1.0",
    lifespan=lifespan,
)

import os

# Allow frontend origins
allowed_origins = [
    "http://localhost:3000",
    "https://kjops-minne.vercel.app",
    "https://kjopsminne.vercel.app",
]
# Add custom frontend URL if set
if frontend_url := os.getenv("FRONTEND_URL"):
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(receipts.router, prefix="/api", tags=["receipts"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(categories.router, prefix="/api", tags=["categories"])
app.include_router(households.router, prefix="/api", tags=["households"])
app.include_router(ingredients.router, prefix="/api", tags=["ingredients"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
