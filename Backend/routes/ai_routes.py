"""
routes/ai_routes.py — AI-Powered Smart Endpoints
Unified API layer for all AI intelligence features.
"""

from fastapi import APIRouter, Query
from typing import Optional

from models.ai import (
    AIResponse,
    ScoreResponse,
    AlertResponse,
    DecisionResponse,
    PredictionResponse,
    ScheduleResponse,
    MentalStateRequest,
    MentalStateResponse,
)
from services.score_service import calculate_life_score
from services.alert_service import check_alerts
from services.decision_service import get_recommended_task
from services.prediction_service import predict_outcomes
from services.scheduler_service import generate_daily_schedule
from services.proactive_service import get_proactive_insight
from services.mental_service import analyze_mental_state
from ai_handler import generate_response
from utils.helpers import format_tasks_for_prompt, get_today_str
from database import tasks_collection

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])


# ─────────────────────────────────────────────
# 1. LIFE SCORE
# ─────────────────────────────────────────────
@router.get("/score", response_model=ScoreResponse)
async def get_life_score():
    """
    Calculate and return the user's productivity score,
    stats, streak, and consistency metrics.
    """
    data = calculate_life_score()
    return ScoreResponse(**data)


# ─────────────────────────────────────────────
# 2. FAILURE ALERTS
# ─────────────────────────────────────────────
@router.get("/alerts", response_model=AlertResponse)
async def get_alerts():
    """
    Check for failure conditions (low completion, overdue tasks,
    approaching deadlines) and return severity-based alerts.
    """
    alert_data = check_alerts()

    # Generate AI summary if there are alerts
    ai_summary = ""
    if alert_data["has_alerts"]:
        context = alert_data["context"]
        prompt = f"""You are SecondBrain AI. The user has these issues:
{context}

Write a brief, direct summary (2-3 sentences) of the situation and what they should do first. Be motivating, not harsh."""
        ai_summary = await generate_response(prompt)

    return AlertResponse(
        has_alerts=alert_data["has_alerts"],
        alerts=alert_data["alerts"],
        ai_summary=ai_summary,
    )


# ─────────────────────────────────────────────
# 3. AUTONOMOUS DECISION ENGINE
# ─────────────────────────────────────────────
@router.get("/decide", response_model=DecisionResponse)
async def get_decision():
    """
    Analyze pending tasks and use AI to recommend
    the single best task to work on right now.
    """
    result = await get_recommended_task()
    return DecisionResponse(**result)


# ─────────────────────────────────────────────
# 4. LIFE PREDICTION ENGINE
# ─────────────────────────────────────────────
@router.get("/predict", response_model=PredictionResponse)
async def get_prediction():
    """
    Collect task data and behavioral patterns,
    predict success/failure, and provide suggestions.
    """
    result = await predict_outcomes()
    return PredictionResponse(**result)


# ─────────────────────────────────────────────
# 5. AUTO SCHEDULER
# ─────────────────────────────────────────────
@router.get("/schedule", response_model=ScheduleResponse)
async def get_schedule(
    hours: Optional[int] = Query(default=8, ge=1, le=16, description="Available working hours")
):
    """
    Generate a time-blocked daily schedule using AI.
    """
    result = await generate_daily_schedule(available_hours=hours)
    return ScheduleResponse(**result)


# ─────────────────────────────────────────────
# 6. PROACTIVE AI (DASHBOARD)
# ─────────────────────────────────────────────
@router.get("/proactive")
async def get_proactive():
    """
    Generate a proactive AI suggestion based on
    the user's current situation (triggered on dashboard load).
    """
    result = await get_proactive_insight()
    return result


# ─────────────────────────────────────────────
# 7. MENTAL STATE DETECTION
# ─────────────────────────────────────────────
@router.post("/mental", response_model=MentalStateResponse)
async def detect_mental_state(request: MentalStateRequest):
    """
    Analyze user's text input to detect emotional state
    and provide supportive, personalized advice.
    """
    result = await analyze_mental_state(request.text)
    return MentalStateResponse(**result)


# ─────────────────────────────────────────────
# 8. SMART SUGGESTIONS (kept from v1)
# ─────────────────────────────────────────────
@router.get("/suggestions", response_model=AIResponse)
async def get_suggestions():
    """
    Fetch all pending tasks, ask AI to prioritize them,
    and suggest what the user should focus on today.
    """
    tasks = list(tasks_collection.find({"status": "pending"}))
    task_text = format_tasks_for_prompt(tasks)
    today = get_today_str()

    prompt = f"""You are SecondBrain AI, a smart productivity assistant.

Today is {today}.

Here are the user's pending tasks:
{task_text}

Your job:
1. Prioritize these tasks based on urgency (closest deadlines first) and importance.
2. Suggest which tasks the user should focus on TODAY.
3. Give a brief reason for each suggestion.
4. Keep your response concise, actionable, and motivating.

Format your response with clear numbering and short explanations."""

    result = await generate_response(prompt)
    return AIResponse(success=True, data=result)
