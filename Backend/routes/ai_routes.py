"""
routes/ai_routes.py — AI-Powered Smart Endpoints
Uses Gemini to provide task suggestions, daily plans, and deadline alerts.
"""

from fastapi import APIRouter
from datetime import datetime, timezone

from database import tasks_collection
from ai_handler import generate_response
from models import AIResponse

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])


def get_pending_tasks() -> list[dict]:
    """Fetch all pending tasks from the database."""
    return list(tasks_collection.find({"status": "pending"}))


def format_tasks_for_prompt(tasks: list[dict]) -> str:
    """Convert task documents into a readable string for the AI prompt."""
    if not tasks:
        return "No pending tasks found."

    lines = []
    for i, task in enumerate(tasks, 1):
        lines.append(f"{i}. \"{task['title']}\" — Deadline: {task['deadline']}")
    return "\n".join(lines)


# ─────────────────────────────────────────────
# 1. SMART SUGGESTIONS
# ─────────────────────────────────────────────
@router.get("/suggestions", response_model=AIResponse)
async def get_suggestions():
    """
    Fetch all pending tasks, ask AI to prioritize them,
    and suggest what the user should focus on today.
    """
    tasks = get_pending_tasks()
    task_text = format_tasks_for_prompt(tasks)
    today = datetime.now(timezone.utc).strftime("%A, %B %d, %Y")

    prompt = f"""You are a smart productivity assistant called SecondBrain AI.

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
# 2. DAILY PLAN GENERATOR
# ─────────────────────────────────────────────
@router.get("/daily-plan", response_model=AIResponse)
async def get_daily_plan():
    """
    Fetch tasks and ask AI to create a structured,
    time-based daily schedule.
    """
    tasks = get_pending_tasks()
    task_text = format_tasks_for_prompt(tasks)
    today = datetime.now(timezone.utc).strftime("%A, %B %d, %Y")

    prompt = f"""You are SecondBrain AI, a smart daily planner.

Today is {today}.

Here are the user's pending tasks:
{task_text}

Your job:
1. Create a structured daily schedule with specific time blocks (e.g., 9:00 AM - 10:30 AM).
2. Assign each task to a time slot based on priority and estimated effort.
3. Include short breaks between tasks.
4. Add a morning warm-up and evening review slot.
5. Make the plan realistic and achievable.

Format the plan as a clean, time-based schedule. Use clear formatting."""

    result = await generate_response(prompt)
    return AIResponse(success=True, data=result)


# ─────────────────────────────────────────────
# 3. ALERTS & PREDICTIONS
# ─────────────────────────────────────────────
@router.get("/alerts", response_model=AIResponse)
async def get_alerts():
    """
    Check task deadlines, identify urgent/overdue tasks,
    and generate AI-powered warnings and predictions.
    """
    tasks = get_pending_tasks()
    now = datetime.now(timezone.utc)
    today = now.strftime("%A, %B %d, %Y at %I:%M %p UTC")

    # Classify tasks by urgency
    overdue = []
    urgent = []  # Due within 24 hours
    upcoming = []  # Due within 3 days
    safe = []

    for task in tasks:
        try:
            deadline = datetime.fromisoformat(task["deadline"].replace("Z", "+00:00"))
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            
            hours_remaining = (deadline - now).total_seconds() / 3600

            entry = f"\"{task['title']}\" — Deadline: {task['deadline']}"
            if hours_remaining < 0:
                overdue.append(entry)
            elif hours_remaining <= 24:
                urgent.append(entry)
            elif hours_remaining <= 72:
                upcoming.append(entry)
            else:
                safe.append(entry)
        except (ValueError, TypeError):
            # If deadline can't be parsed, treat as urgent
            urgent.append(f"\"{task['title']}\" — Deadline: {task['deadline']} (⚠️ unparseable date)")

    # Build context for AI
    context_parts = []
    if overdue:
        context_parts.append(f"🔴 OVERDUE TASKS:\n" + "\n".join(overdue))
    if urgent:
        context_parts.append(f"🟠 URGENT (due within 24h):\n" + "\n".join(urgent))
    if upcoming:
        context_parts.append(f"🟡 UPCOMING (due within 3 days):\n" + "\n".join(upcoming))
    if safe:
        context_parts.append(f"🟢 SAFE (due later):\n" + "\n".join(safe))

    if not context_parts:
        return AIResponse(
            success=True,
            data="✅ No pending tasks found. You're all clear! Time to add some new goals."
        )

    task_context = "\n\n".join(context_parts)

    prompt = f"""You are SecondBrain AI, an intelligent alert and prediction system.

Current time: {today}

Here is the status of the user's tasks:
{task_context}

Your job:
1. Generate clear, urgent warnings for overdue and at-risk tasks.
2. Predict whether the user is falling behind based on the workload and deadlines.
3. Suggest immediate actions to get back on track.
4. Be direct and motivating — don't sugarcoat if they're behind.
5. If everything looks good, give positive reinforcement.

Format your response with emoji-based severity indicators and clear action items."""

    result = await generate_response(prompt)
    return AIResponse(success=True, data=result)
