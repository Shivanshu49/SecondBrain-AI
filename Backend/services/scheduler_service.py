"""
services/scheduler_service.py — Auto Scheduler / Smart Planner
Generates a time-blocked daily schedule using Gemini.
"""

from database import tasks_collection, entries_collection
from ai_handler import generate_json_response, generate_response
from utils.helpers import format_tasks_for_prompt, get_today_str


async def generate_daily_schedule(available_hours: int = 8, user_id: str = None) -> dict:
    """
    Take pending tasks from both collections and available hours, ask Gemini
    to create a structured daily schedule with time slots.
    """
    query = {"status": "pending"}
    if user_id:
        query["user_id"] = user_id
    pending = list(tasks_collection.find(query))
    e_query = {"type": "task", "status": "pending"}
    if user_id:
        e_query["user_id"] = user_id
    task_entries = list(entries_collection.find(e_query))
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
            # AI failed — generate a basic local schedule instead of calling AI again
            schedule = _generate_local_schedule(pending, available_hours)
            return {
                "success": True,
                "schedule": schedule,
                "ai_notes": "📋 Auto-generated schedule (AI temporarily unavailable). Tasks ordered by urgency.",
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


def _generate_local_schedule(pending: list, available_hours: int) -> list:
    """
    Generate a simple time-blocked schedule locally when AI is unavailable.
    Distributes tasks across available hours starting at 9 AM.
    """
    from utils.helpers import hours_until_deadline, priority_to_int

    # Sort by urgency then priority
    def sort_key(task):
        h = hours_until_deadline(task.get("deadline", ""))
        urgency = h if h is not None else 9999
        pri = priority_to_int(task.get("priority", "medium"))
        return (urgency, -pri)

    pending.sort(key=sort_key)

    schedule = []
    hour = 9  # Start at 9 AM
    minutes = 0
    slots_used = 0
    max_slots = available_hours  # ~1 task per hour

    # Morning warm-up
    schedule.append({
        "time": "9:00 AM - 9:15 AM",
        "task": "☀️ Morning Warm-up: Review your priorities",
        "priority": "low",
    })
    hour = 9
    minutes = 15

    for task in pending[:max_slots]:
        # Format start time
        start_h = hour
        start_m = minutes
        start_period = "AM" if start_h < 12 else "PM"
        start_display = start_h if start_h <= 12 else start_h - 12
        if start_display == 0:
            start_display = 12

        # Add 60 minutes for the task
        end_h = start_h + 1
        end_m = start_m
        end_period = "AM" if end_h < 12 else "PM"
        end_display = end_h if end_h <= 12 else end_h - 12
        if end_display == 0:
            end_display = 12

        time_str = f"{start_display}:{start_m:02d} {start_period} - {end_display}:{end_m:02d} {end_period}"

        schedule.append({
            "time": time_str,
            "task": task.get("title", "Untitled"),
            "priority": task.get("priority", "medium"),
        })

        hour = end_h
        minutes = end_m
        slots_used += 1

        # Add a break every 2 tasks
        if slots_used % 2 == 0 and slots_used < max_slots:
            brk_period = "AM" if hour < 12 else "PM"
            brk_display = hour if hour <= 12 else hour - 12
            if brk_display == 0:
                brk_display = 12
            brk_end = hour
            brk_end_m = minutes + 15
            if brk_end_m >= 60:
                brk_end += 1
                brk_end_m -= 60
            brk_end_period = "AM" if brk_end < 12 else "PM"
            brk_end_display = brk_end if brk_end <= 12 else brk_end - 12
            if brk_end_display == 0:
                brk_end_display = 12

            schedule.append({
                "time": f"{brk_display}:{minutes:02d} {brk_period} - {brk_end_display}:{brk_end_m:02d} {brk_end_period}",
                "task": "☕ Short Break",
                "priority": "low",
            })
            hour = brk_end
            minutes = brk_end_m

        if hour >= 9 + available_hours:
            break

    return schedule
