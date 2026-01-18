from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import analytics, categories, receipts, upload
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(receipts.router, prefix="/api", tags=["receipts"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(categories.router, prefix="/api", tags=["categories"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
