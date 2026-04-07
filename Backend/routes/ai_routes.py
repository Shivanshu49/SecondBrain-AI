"""
routes/ai_routes.py — AI-Powered Smart Endpoints
Unified API layer for all AI intelligence features.
All endpoints extract user_id from JWT and pass to services for per-user isolation.
"""

from fastapi import APIRouter, Query, Request
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
    NLPCaptureRequest,
    NLPCaptureResponse,
    GoalRequest,
    GoalResponse,
    BrainDumpRequest,
    BrainDumpResponse,
)
from models.entry import (
    CaptureRequest,
    CaptureResponse,
    InsightResponse,
    ReflectionResponse,
    RelatedEntry,
)
from services.score_service import calculate_life_score
from services.alert_service import check_alerts
from services.decision_service import get_recommended_task
from services.prediction_service import predict_outcomes
from services.scheduler_service import generate_daily_schedule
from services.proactive_service import get_proactive_insight
from services.mental_service import analyze_mental_state
from services.nlp_capture_service import parse_natural_task
from services.goal_service import decompose_goal
from services.braindump_service import process_brain_dump
from services.capture_service import classify_and_capture
from services.insight_service import generate_daily_insights
from services.reflection_service import generate_reflection
from services.connection_service import find_related_entries, update_related_ids
from ai_handler import generate_response
from utils.helpers import format_tasks_for_prompt, get_today_str
from database import tasks_collection, entries_collection
from auth import get_user_id

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])


# ─────────────────────────────────────────────
# 1. LIFE SCORE
# ─────────────────────────────────────────────
@router.get("/score", response_model=ScoreResponse)
async def get_life_score(request: Request):
    """Calculate and return the user's productivity score."""
    user_id = get_user_id(request)
    data = calculate_life_score(user_id)
    return ScoreResponse(**data)


# ─────────────────────────────────────────────
# 2. FAILURE ALERTS
# ─────────────────────────────────────────────
@router.get("/alerts", response_model=AlertResponse)
async def get_alerts(request: Request):
    """Check for failure conditions and return severity-based alerts."""
    user_id = get_user_id(request)
    alert_data = check_alerts(user_id)

    ai_summary = ""
    if alert_data["has_alerts"]:
        context = alert_data["context"]
        prompt = f"""You are SecondBrain AI. The user has these issues:
{context}

Write a brief, direct summary (2-3 sentences) of the situation and what they should do first. Be motivating, not harsh."""
        try:
            ai_summary = await generate_response(prompt)
            # Check if AI returned a rate-limit message
            if "rate-limited" in ai_summary.lower() or "⏳" in ai_summary:
                # Build local summary from alert data
                alert_msgs = [a["message"] for a in alert_data["alerts"]]
                critical = [a for a in alert_data["alerts"] if a["severity"] in ("critical", "high")]
                if critical:
                    ai_summary = f"You have {len(critical)} urgent alert(s). Focus on your most critical items first — tackle one at a time and you'll be back on track."
                else:
                    ai_summary = "A few things need your attention. Review your alerts above and address them to keep your productivity on track."
        except Exception as e:
            print(f"⚠️ Alert AI summary failed: {e}")
            ai_summary = "Review the alerts above and prioritize your most urgent items."

    return AlertResponse(
        has_alerts=alert_data["has_alerts"],
        alerts=alert_data["alerts"],
        ai_summary=ai_summary,
    )


# ─────────────────────────────────────────────
# 3. AUTONOMOUS DECISION ENGINE
# ─────────────────────────────────────────────
@router.get("/decide", response_model=DecisionResponse)
async def get_decision(request: Request):
    """Analyze pending tasks and recommend the best task to work on."""
    user_id = get_user_id(request)
    result = await get_recommended_task(user_id)
    return DecisionResponse(**result)


# ─────────────────────────────────────────────
# 4. LIFE PREDICTION ENGINE
# ─────────────────────────────────────────────
@router.get("/predict", response_model=PredictionResponse)
async def get_prediction(request: Request):
    """Predict success/failure and provide suggestions."""
    user_id = get_user_id(request)
    result = await predict_outcomes(user_id)
    return PredictionResponse(**result)


# ─────────────────────────────────────────────
# 5. AUTO SCHEDULER
# ─────────────────────────────────────────────
@router.get("/schedule", response_model=ScheduleResponse)
async def get_schedule(
    request: Request,
    hours: Optional[int] = Query(
        default=8, ge=1, le=16, description="Available working hours"
    ),
):
    """Generate a time-blocked daily schedule using AI."""
    user_id = get_user_id(request)
    result = await generate_daily_schedule(available_hours=hours, user_id=user_id)
    return ScheduleResponse(**result)


# ─────────────────────────────────────────────
# 6. PROACTIVE AI (DASHBOARD)
# ─────────────────────────────────────────────
@router.get("/proactive")
async def get_proactive(request: Request):
    """Generate a proactive AI suggestion based on user's current situation."""
    user_id = get_user_id(request)
    result = await get_proactive_insight(user_id)
    return result


# ─────────────────────────────────────────────
# 7. MENTAL STATE DETECTION
# ─────────────────────────────────────────────
@router.post("/mental", response_model=MentalStateResponse)
async def detect_mental_state(req: MentalStateRequest):
    """Analyze user's text input to detect emotional state."""
    result = await analyze_mental_state(req.text)
    return MentalStateResponse(**result)


# ─────────────────────────────────────────────
# 8. SMART SUGGESTIONS
# ─────────────────────────────────────────────
@router.get("/suggestions", response_model=AIResponse)
async def get_suggestions(request: Request):
    """Fetch pending tasks and suggest what to focus on today."""
    user_id = get_user_id(request)
    query = {"status": "pending", "user_id": user_id}
    tasks = list(tasks_collection.find(query))
    task_entries = list(entries_collection.find({"type": "task", "status": "pending", "user_id": user_id}))
    tasks.extend(task_entries)
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


# ─────────────────────────────────────────────
# 9. PRIORITIZE (alias for suggestions)
# ─────────────────────────────────────────────
@router.get("/prioritize", response_model=AIResponse)
async def prioritize_tasks(request: Request):
    """Alias for /suggestions."""
    return await get_suggestions(request)


# ─────────────────────────────────────────────
# 10. ANALYZE (alias for mental)
# ─────────────────────────────────────────────
@router.post("/analyze", response_model=MentalStateResponse)
async def analyze_user_state(req: MentalStateRequest):
    """Alias for /mental."""
    result = await analyze_mental_state(req.text)
    return MentalStateResponse(**result)


# ─────────────────────────────────────────────
# 11. NLP QUICK CAPTURE
# ─────────────────────────────────────────────
@router.post("/nlp-capture", response_model=NLPCaptureResponse)
async def nlp_capture(req: NLPCaptureRequest, request: Request):
    """Parse natural language text into a structured task."""
    user_id = get_user_id(request)
    result = await parse_natural_task(req.text, user_id)
    return NLPCaptureResponse(**result)


# ─────────────────────────────────────────────
# 12. GOAL DECOMPOSITION
# ─────────────────────────────────────────────
@router.post("/goal", response_model=GoalResponse)
async def decompose_goal_endpoint(req: GoalRequest, request: Request):
    """Break a big goal into actionable sub-tasks."""
    user_id = get_user_id(request)
    result = await decompose_goal(req.goal, user_id)
    return GoalResponse(**result)


# ─────────────────────────────────────────────
# 13. BRAIN DUMP
# ─────────────────────────────────────────────
@router.post("/braindump", response_model=BrainDumpResponse)
async def brain_dump(req: BrainDumpRequest):
    """Categorize thoughts into urgent/later/ignore."""
    result = await process_brain_dump(req.text)
    return BrainDumpResponse(**result)


# ─────────────────────────────────────────────
# 14. UNIVERSAL CAPTURE
# ─────────────────────────────────────────────
@router.post("/capture", response_model=CaptureResponse)
async def universal_capture(req: CaptureRequest, request: Request):
    """Classify text as task/idea/note/goal and save."""
    user_id = get_user_id(request)
    result = await classify_and_capture(req.text, user_id)
    return CaptureResponse(**result)


# ─────────────────────────────────────────────
# 15. DAILY INSIGHTS
# ─────────────────────────────────────────────
@router.get("/insights", response_model=InsightResponse)
async def get_insights(request: Request):
    """Generate daily AI insights from recent data."""
    user_id = get_user_id(request)
    result = await generate_daily_insights(user_id)
    return InsightResponse(**result)


# ─────────────────────────────────────────────
# 16. BRAIN REFLECTION
# ─────────────────────────────────────────────
@router.get("/reflection", response_model=ReflectionResponse)
async def get_reflection(request: Request):
    """Analyze past data to show growth and patterns."""
    user_id = get_user_id(request)
    result = await generate_reflection(user_id)
    return ReflectionResponse(**result)


# ─────────────────────────────────────────────
# 17. ENTRY CONNECTIONS
# ─────────────────────────────────────────────
@router.get("/entries/{entry_id}/related", response_model=list[RelatedEntry])
async def get_related_entries(entry_id: str, request: Request):
    """Find entries related to a given entry."""
    user_id = get_user_id(request)
    result = find_related_entries(entry_id, limit=5, user_id=user_id)
    return [RelatedEntry(**r) for r in result]


@router.post("/entries/{entry_id}/connect")
async def connect_entry(entry_id: str, request: Request):
    """Update an entry's related_ids with found connections."""
    user_id = get_user_id(request)
    related_ids = update_related_ids(entry_id)
    return {
        "success": True,
        "entry_id": entry_id,
        "related_count": len(related_ids),
        "related_ids": related_ids,
    }
