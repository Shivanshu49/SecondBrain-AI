"""
services/insight_service.py — Daily AI Insight Engine
Generates 2-3 actionable insights from recent entries, pending tasks, and deadlines.
"""

from datetime import datetime, timezone, timedelta
from database import entries_collection, tasks_collection
from ai_handler import generate_json_response
from utils.helpers import get_today_str, hours_until_deadline


async def generate_daily_insights() -> dict:
    """
    Collect recent entries, pending tasks, overdue items, and deadlines.
    Send to Gemini for 2-3 insights + mood assessment.
    """
    today = get_today_str()
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    all_entries = list(entries_collection.find())
    all_tasks = list(tasks_collection.find())

    pending_tasks = [t for t in all_tasks if t.get("status") == "pending"]
    completed_tasks = [t for t in all_tasks if t.get("status") == "completed"]

    recent_entries = [
        e
        for e in all_entries
        if _parse_date(e.get("created_at", ""))
        and _parse_date(e.get("created_at", "")) >= week_ago
    ]

    overdue = []
    due_soon = []
    for task in pending_tasks:
        h = hours_until_deadline(task.get("deadline", ""))
        if h is not None:
            if h < 0:
                overdue.append(task["title"])
            elif h <= 24:
                due_soon.append(task["title"])

    type_counts = {}
    for entry in all_entries:
        et = entry.get("type", "unknown")
        type_counts[et] = type_counts.get(et, 0) + 1

    total = len(all_tasks)
    completed_count = len(completed_tasks)
    rate = round((completed_count / total) * 100, 1) if total > 0 else 0

    context = f"""TODAY: {today}

STATS:
- Total tasks: {total}
- Completed: {completed_count}
- Pending: {len(pending_tasks)}
- Completion rate: {rate}%
- Overdue: {len(overdue)} ({", ".join(overdue[:3]) if overdue else "none"})
- Due within 24h: {len(due_soon)} ({", ".join(due_soon[:3]) if due_soon else "none"})

ENTRY TYPES: {type_counts}
RECENT ACTIVITY ({len(recent_entries)} entries this week):"""

    for entry in recent_entries[:10]:
        context += f"\n- [{entry.get('type', '?')}] {entry.get('title', entry.get('content', '')[:60])}"

    prompt = f"""You are SecondBrain AI, a daily insight engine.

{context}

Analyze this data and return a JSON object:
{{
  "insights": [
    "insight 1 — specific, actionable observation",
    "insight 2 — pattern or trend the user should notice",
    "insight 3 — suggestion based on their data"
  ],
  "summary": "one-line summary of the user's current state",
  "mood": "one word: thriving, productive, steady, struggling, overwhelmed, or idle"
}}

Rules:
1. Generate exactly 2-3 insights (no more, no less).
2. Each insight should be specific to the data above — not generic.
3. Be direct, honest, but encouraging.
4. If overdue tasks exist, mention them specifically.
5. If completion rate is high, acknowledge it.
6. If no recent activity, note the inactivity.
7. Mood should reflect their actual productivity state."""

    result = await generate_json_response(prompt)

    if isinstance(result, dict) and "error" in result:
        return {
            "success": False,
            "error": result["error"],
            "insights": [],
            "summary": "Could not generate insights right now.",
            "mood": "neutral",
        }

    insights = result.get("insights", [])
    if not isinstance(insights, list):
        insights = [str(insights)]

    return {
        "success": True,
        "insights": insights[:3],
        "summary": result.get("summary", "Here's your daily overview."),
        "mood": result.get("mood", "neutral"),
    }


def _parse_date(date_str: str):
    """Safely parse a date string."""
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None
