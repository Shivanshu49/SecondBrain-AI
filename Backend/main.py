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
from routes.auth_routes import router as auth_router


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
    allow_origins=["*"],  # Restrict to specific origins in production
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# MOUNT ROUTERS
# ─────────────────────────────────────────────
app.include_router(tasks_router)
app.include_router(ai_router)
app.include_router(auth_router)


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    """Root endpoint — confirms the server is running."""
    return {
        "status": "running",
        "service": "SecondBrain AI",
        "version": "3.0.0",
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
            "nlp_capture": "/api/ai/nlp-capture",
            "goal": "/api/ai/goal",
            "braindump": "/api/ai/braindump",
            "suggestions": "/api/ai/suggestions",
            "auth_signup": "/api/auth/signup",
            "auth_login": "/api/auth/login",
            "docs": "/docs",
        },
    }
