"""
services/decision_service.py — Autonomous Decision Engine
Picks the best task for the user to work on next using AI analysis.
"""

from database import tasks_collection, entries_collection
from ai_handler import generate_response
from utils.helpers import (
    format_tasks_for_prompt,
    hours_until_deadline,
    priority_to_int,
    get_today_str,
)


async def get_recommended_task(user_id: str = None) -> dict:
    """
    Analyze pending tasks from both collections, sort by urgency + priority,
    pick top candidates, and ask Gemini to select the best one.
    """
    query = {"status": "pending"}
    if user_id:
        query["user_id"] = user_id
    pending = list(tasks_collection.find(query))
    entry_query = {"type": "task", "status": "pending"}
    if user_id:
        entry_query["user_id"] = user_id
    task_entries = list(entries_collection.find(entry_query))
    pending.extend(task_entries)

    if not pending:
        return {
            "success": True,
            "selected_task": None,
            "task_id": None,
            "reason": "🎉 No pending tasks! You're all caught up.",
            "alternatives": [],
        }

    # Sort by urgency (deadline) then priority
    def sort_key(task):
        h = hours_until_deadline(task.get("deadline", ""))
        urgency = h if h is not None else 9999
        pri = priority_to_int(task.get("priority", "medium"))
        return (urgency, -pri)  # closest deadline first, then highest priority

    pending.sort(key=sort_key)

    # Pick top 3 candidates
    candidates = pending[:3]
    task_text = format_tasks_for_prompt(candidates)
    today = get_today_str()

    prompt = f"""You are SecondBrain AI, an autonomous decision engine.

Today is {today}.

The user has these top-priority pending tasks:
{task_text}

Your job:
1. Choose the ONE task the user should work on RIGHT NOW.
2. Explain WHY this is the best choice (consider deadline proximity, priority, and effort).
3. Briefly mention what to do with the other tasks.

Format your response as:
SELECTED: [exact task title]
REASON: [2-3 sentences explaining why]
ALTERNATIVES: [brief note about other tasks]"""

    result = await generate_response(prompt)

    # Extract the selected task title from the response
    selected_title = candidates[0]["title"]  # Default to first
    selected_id = str(candidates[0]["_id"])

    for candidate in candidates:
        if candidate["title"].lower() in result.lower():
            selected_title = candidate["title"]
            selected_id = str(candidate["_id"])
            break

    alternatives = [c["title"] for c in candidates if c["title"] != selected_title]

    return {
        "success": True,
        "selected_task": selected_title,
        "task_id": selected_id,
        "reason": result,
        "alternatives": alternatives,
    }
