"""
services/proactive_service.py — Proactive AI System
Generates contextual suggestions when the user opens the dashboard.
"""

from database import tasks_collection, entries_collection
from ai_handler import generate_response
from utils.helpers import hours_until_deadline, get_today_str
from services.score_service import calculate_life_score


async def get_proactive_insight(user_id: str = None) -> dict:
    """
    Check the user's situation from both collections (missed tasks, low score, near deadlines)
    and generate a proactive suggestion via Gemini.
    """
    score_data = calculate_life_score(user_id)
    query = {"status": "pending"}
    if user_id:
        query["user_id"] = user_id
    pending = list(tasks_collection.find(query))
    e_query = {"type": "task", "status": "pending"}
    if user_id:
        e_query["user_id"] = user_id
    task_entries = list(entries_collection.find(e_query))
    pending.extend(task_entries)

    # Identify trigger conditions
    triggers = []

    # Condition 1: Missed/overdue tasks
    overdue_titles = []
    for task in pending:
        h = hours_until_deadline(task.get("deadline", ""))
        if h is not None and h < 0:
            overdue_titles.append(task["title"])

    if overdue_titles:
        triggers.append(f"OVERDUE TASKS: {', '.join(overdue_titles[:3])}")

    # Condition 2: Low productivity score
    if score_data["score"] < 40:
        triggers.append(
            f"LOW SCORE: Productivity score is only {score_data['score']}/100"
        )

    # Condition 3: Approaching deadlines (within 24h)
    urgent_titles = []
    for task in pending:
        h = hours_until_deadline(task.get("deadline", ""))
        if h is not None and 0 < h <= 24:
            urgent_titles.append(task["title"])

    if urgent_titles:
        triggers.append(f"URGENT DEADLINES: {', '.join(urgent_titles[:3])}")

    # Condition 4: No streak (no completions today/yesterday)
    if score_data["streak"] == 0 and score_data["total_tasks"] > 0:
        triggers.append("BROKEN STREAK: No tasks completed recently")

    # Condition 5: Too many pending tasks
    if score_data["pending_tasks"] >= 6:
        triggers.append(f"TASK OVERLOAD: {score_data['pending_tasks']} pending tasks")

    # If no triggers, give positive message
    if not triggers:
        if score_data["total_tasks"] == 0:
            return {
                "success": True,
                "message": "👋 Welcome to SecondBrain AI! Add your first task to get started.",
                "has_trigger": False,
            }
        return {
            "success": True,
            "message": f"✅ You're doing great! Score: {score_data['score']}/100. "
            f"Streak: {score_data['streak']} days. Keep it up! 🔥",
            "has_trigger": False,
        }

    # Ask Gemini for a proactive suggestion
    today = get_today_str()
    trigger_text = "\n".join(f"- {t}" for t in triggers)

    prompt = f"""You are SecondBrain AI, a proactive assistant.

Today is {today}.

The user just opened their dashboard. Here's what I detected:
{trigger_text}

User stats:
- Score: {score_data["score"]}/100
- Completed: {score_data["completed_tasks"]}/{score_data["total_tasks"]}
- Streak: {score_data["streak"]} days

Generate a SHORT, direct, motivating message (2-3 sentences max).
- Acknowledge what's wrong
- Suggest ONE specific action
- Be encouraging, not harsh
- Use 1-2 relevant emojis

Example: "You missed 2 tasks yesterday. Let's reschedule them for today — start with 'Project Report' since it's overdue. You've got this! 💪" """

    result = await generate_response(prompt)

    return {
        "success": True,
        "message": result,
        "has_trigger": True,
    }
