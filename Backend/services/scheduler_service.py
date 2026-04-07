"""
services/scheduler_service.py — Auto Scheduler / Smart Planner
Generates a time-blocked daily schedule using Gemini.
"""

from database import tasks_collection, entries_collection
from ai_handler import generate_json_response, generate_response
from utils.helpers import format_tasks_for_prompt, get_today_str


async def generate_daily_schedule(available_hours: int = 8) -> dict:
    """
    Take pending tasks from both collections and available hours, ask Gemini
    to create a structured daily schedule with time slots.
    """
    pending = list(tasks_collection.find({"status": "pending"}))
    task_entries = list(entries_collection.find({"type": "task", "status": "pending"}))
    pending.extend(task_entries)

    if not pending:
        return {
            "success": True,
            "schedule": [],
            "ai_notes": "No pending tasks to schedule. Add some tasks first!",
        }

    task_text = format_tasks_for_prompt(pending)
    today = get_today_str()

    prompt = f"""You are SecondBrain AI, a smart daily planner.

Today is {today}.
Available working hours: {available_hours} hours (starting from 9:00 AM).

Pending tasks:
{task_text}

Create a daily schedule. Return a JSON array of time slots:
[
  {{"time": "9:00 AM - 10:00 AM", "task": "Task title here", "priority": "high"}},
  {{"time": "10:00 AM - 10:15 AM", "task": "☕ Short Break", "priority": "low"}},
  ...
]

Rules:
1. Assign tasks to time slots based on priority (high priority = morning).
2. Include 15-minute breaks every 90 minutes.
3. Start with a 15-min morning warm-up and end with a 15-min evening review.
4. Be realistic — don't overschedule.
5. If there are more tasks than time, prioritize the most urgent ones and note the rest.
6. Add an "ai_notes" field at the end with any additional advice."""

    json_result = await generate_json_response(prompt)

    # Handle different response shapes
    if isinstance(json_result, list):
        schedule = json_result
        ai_notes = ""
    elif isinstance(json_result, dict):
        if "error" in json_result:
            # Fallback to text response
            text_result = await generate_response(
                prompt.replace("Return a JSON array", "Return a formatted schedule")
            )
            return {
                "success": True,
                "schedule": [],
                "ai_notes": text_result,
            }
        schedule = json_result.get("schedule", json_result.get("slots", []))
        ai_notes = json_result.get("ai_notes", "")
        if not schedule and not ai_notes:
            # The response might be the array itself inside a wrapper
            schedule = [v for v in json_result.values() if isinstance(v, list)]
            schedule = schedule[0] if schedule else []
    else:
        schedule = []
        ai_notes = "Could not generate schedule. Please try again."

    # Normalize schedule items
    normalized = []
    for slot in schedule:
        if isinstance(slot, dict):
            normalized.append(
                {
                    "time": slot.get("time", ""),
                    "task": slot.get("task", ""),
                    "priority": slot.get("priority", "medium"),
                }
            )

    return {
        "success": True,
        "schedule": normalized,
        "ai_notes": ai_notes,
    }
