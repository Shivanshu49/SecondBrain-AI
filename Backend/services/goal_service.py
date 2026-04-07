"""
services/goal_service.py — Agentic AI Goal Decomposition
Breaks a big goal into actionable sub-tasks using Gemini AI.
"""

import uuid
from datetime import datetime, timezone, timedelta
from ai_handler import generate_json_response
from database import tasks_collection
from utils.helpers import get_today_str


async def decompose_goal(goal: str, user_id: str = None) -> dict:
    """
    Send a goal to Gemini, receive a list of sub-tasks,
    save them all to MongoDB with a shared group_id,
    and return the created tasks.
    """
    today = get_today_str()
    now = datetime.now(timezone.utc)

    prompt = f"""You are SecondBrain AI, an agentic task planner.

Today is {today}.

The user has this goal:
"{goal}"

Break this goal into 3-7 actionable sub-tasks. Return a JSON object:
{{
  "goal_summary": "one-line summary of the goal",
  "tasks": [
    {{
      "title": "clear, actionable task title",
      "deadline": "ISO 8601 datetime string",
      "priority": "low, medium, or high",
      "order": 1
    }}
  ]
}}

Rules:
1. Tasks should be specific and actionable (start with a verb).
2. Order them logically (dependencies first).
3. Spread deadlines realistically over the next 1-14 days.
4. First task deadline should be within 1-2 days.
5. Assign higher priority to foundational/blocking tasks.
6. Keep titles concise (max 80 chars).
7. Return between 3 and 7 tasks."""

    result = await generate_json_response(prompt)

    # Handle AI errors
    if isinstance(result, dict) and "error" in result:
        return {
            "success": False,
            "error": result["error"],
            "goal_summary": goal,
            "group_id": None,
            "tasks": [],
        }

    goal_summary = result.get("goal_summary", goal)
    raw_tasks = result.get("tasks", [])

    if not isinstance(raw_tasks, list) or len(raw_tasks) == 0:
        return {
            "success": False,
            "error": "AI could not decompose this goal. Try rephrasing.",
            "goal_summary": goal_summary,
            "group_id": None,
            "tasks": [],
        }

    # Generate a unique group_id shared by all tasks from this goal
    group_id = str(uuid.uuid4())[:8]
    created_tasks = []

    for i, raw in enumerate(raw_tasks[:7]):  # Cap at 7
        if not isinstance(raw, dict):
            continue

        title = raw.get("title", f"Task {i + 1}")[:200]
        priority = raw.get("priority", "medium").lower()
        if priority not in ("low", "medium", "high"):
            priority = "medium"

        # Fallback deadline: spread over next days
        fallback_deadline = (now + timedelta(days=i + 1)).replace(
            hour=18, minute=0, second=0, microsecond=0
        ).isoformat()
        deadline = raw.get("deadline", fallback_deadline)

        task_data = {
            "title": title,
            "deadline": deadline,
            "status": "pending",
            "priority": priority,
            "hours_spent": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "source": "goal",
            "group_id": group_id,
            "user_id": user_id,
        }

        inserted = tasks_collection.insert_one(task_data)

        created_tasks.append({
            "id": str(inserted.inserted_id),
            "title": title,
            "deadline": deadline,
            "status": "pending",
            "priority": priority,
            "completed": False,
            "hours_spent": 0.0,
            "created_at": task_data["created_at"],
            "completed_at": None,
            "source": "goal",
            "group_id": group_id,
            "order": raw.get("order", i + 1),
        })

    return {
        "success": True,
        "goal_summary": goal_summary,
        "group_id": group_id,
        "tasks": created_tasks,
    }
