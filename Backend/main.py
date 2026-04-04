"""
main.py — SecondBrain AI Backend Server
FastAPI application with CORS, task management, and AI-powered intelligence.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import check_connection
from routes.tasks import router as tasks_router
from routes.ai_routes import router as ai_router


# ─────────────────────────────────────────────
# LIFESPAN — Runs on startup/shutdown
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("\n🧠 SecondBrain AI Backend starting up...")
    check_connection()
    print("🚀 Server is ready!\n")
    yield
    # Shutdown
    print("\n👋 SecondBrain AI Backend shutting down...")


# ─────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────
app = FastAPI(
    title="SecondBrain AI",
    description="An AI-powered task manager, decision engine, and prediction system.",
    version="2.0.0",
    lifespan=lifespan,
)


# ─────────────────────────────────────────────
# CORS MIDDLEWARE
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# MOUNT ROUTERS
# ─────────────────────────────────────────────
app.include_router(tasks_router)
app.include_router(ai_router)


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    """Root endpoint — confirms the server is running."""
    return {
        "status": "running",
        "service": "SecondBrain AI",
        "version": "2.0.0",
        "message": "🧠 SecondBrain AI Backend is online!",
        "endpoints": {
            "tasks": "/api/tasks",
            "score": "/api/ai/score",
            "alerts": "/api/ai/alerts",
            "decide": "/api/ai/decide",
            "predict": "/api/ai/predict",
            "schedule": "/api/ai/schedule",
            "proactive": "/api/ai/proactive",
            "mental": "/api/ai/mental",
            "suggestions": "/api/ai/suggestions",
            "docs": "/docs",
        },
    }
