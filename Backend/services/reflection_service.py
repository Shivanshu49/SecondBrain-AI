"""
services/reflection_service.py — Brain Reflection Mode
Analyzes completed tasks and past entries to show user growth and patterns.
"""

from datetime import datetime, timezone, timedelta
from database import entries_collection, tasks_collection
from ai_handler import generate_json_response
from utils.helpers import get_today_str


async def generate_reflection(user_id: str = None) -> dict:
    """
    Collect completed tasks, past entries, and behavioral data.
    Ask Gemini: "What has the user improved? What patterns exist?"
    Return growth summary, achievements, patterns, and suggestions.
    """
    today = get_today_str()
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)
    week_ago = now - timedelta(days=7)

    query = {"user_id": user_id} if user_id else {}
    all_tasks = list(tasks_collection.find(query))
    all_entries = list(entries_collection.find(query))

    completed_tasks = [t for t in all_tasks if t.get("status") == "completed"]
    pending_tasks = [t for t in all_tasks if t.get("status") == "pending"]

    recent_completions = [
        t
        for t in completed_tasks
        if _parse_date(t.get("completed_at") or t.get("created_at", ""))
        and _parse_date(t.get("completed_at") or t.get("created_at", "")) >= month_ago
    ]

    week_completions = [
        t
        for t in completed_tasks
        if _parse_date(t.get("completed_at") or t.get("created_at", ""))
        and _parse_date(t.get("completed_at") or t.get("created_at", "")) >= week_ago
    ]

    recent_entries = [
        e
        for e in all_entries
        if _parse_date(e.get("created_at", ""))
        and _parse_date(e.get("created_at", "")) >= week_ago
    ]

    type_counts = {}
    for entry in all_entries:
        et = entry.get("type", "unknown")
        type_counts[et] = type_counts.get(et, 0) + 1

    total = len(all_tasks)
    completed_count = len(completed_tasks)
    rate = round((completed_count / total) * 100, 1) if total > 0 else 0

    context = f"""TODAY: {today}

TASK DATA:
- Total tasks ever: {total}
- Completed: {completed_count}
- Pending: {len(pending_tasks)}
- Completion rate: {rate}%
- Completed this week: {len(week_completions)}
- Completed this month: {len(recent_completions)}

ENTRY DATA (Total: {len(all_entries)}):
- Types: {type_counts}
- Entries this week: {len(recent_entries)}

RECENT COMPLETED TASKS (this month):"""

    for task in recent_completions[:15]:
        completed_at = task.get("completed_at", task.get("created_at", "unknown"))
        context += f"\n- ✓ {task['title']} (completed: {completed_at[:10] if completed_at != 'unknown' else 'unknown'})"

    if recent_entries:
        context += "\n\nRECENT ENTRIES (this week):"
        for entry in recent_entries[:10]:
            context += f"\n- [{entry.get('type', '?')}] {entry.get('title', entry.get('content', '')[:60])}"

    prompt = f"""You are SecondBrain AI, a reflection and growth analysis engine.

{context}

Analyze this data and return a JSON object:
{{
  "growth_summary": "2-3 sentences about how the user has grown/changed based on their data",
  "achievements": [
    "specific achievement 1",
    "specific achievement 2",
    "specific achievement 3"
  ],
  "patterns": [
    "behavioral pattern 1 the user should notice",
    "behavioral pattern 2"
  ],
  "suggestions": [
    "actionable suggestion 1 for continued growth",
    "actionable suggestion 2"
  ]
}}

Rules:
1. Be specific — reference actual tasks/entries from the data.
2. Acknowledge real progress, even if small.
3. Point out patterns (e.g., "You complete more tasks in the morning", "Your ideas are growing").
4. If completion rate is low, frame it constructively.
5. If no completions, focus on the attempt and suggest starting small.
6. Keep achievements realistic and data-backed.
7. Return 2-4 achievements, 1-3 patterns, 2-3 suggestions."""

    result = await generate_json_response(prompt)

    if isinstance(result, dict) and "error" in result:
        return {
            "success": False,
            "error": result["error"],
            "growth_summary": "",
            "achievements": [],
            "patterns": [],
            "suggestions": [],
        }

    return {
        "success": True,
        "growth_summary": result.get("growth_summary", ""),
        "achievements": result.get("achievements", []),
        "patterns": result.get("patterns", []),
        "suggestions": result.get("suggestions", []),
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
