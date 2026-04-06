"""
services/nlp_capture_service.py — NLP Quick Capture
Parses natural language text into a structured task using Gemini AI.
"""

from datetime import datetime, timezone, timedelta
from ai_handler import generate_json_response
from database import tasks_collection
from utils.helpers import get_today_str


async def parse_natural_task(text: str) -> dict:
    """
    Send raw user text to Gemini, extract task details,
    save to MongoDB, and return the created task.
    """
    today = get_today_str()
    now_iso = datetime.now(timezone.utc).isoformat()
    tomorrow_iso = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
        hour=18, minute=0, second=0, microsecond=0
    ).isoformat()

    prompt = f"""You are SecondBrain AI, a smart task parser.

Today is {today}. Current UTC time: {now_iso}

The user typed this natural language input:
"{text}"

Extract a structured task from this text. Return a JSON object with:
{{
  "title": "clear, concise task title (max 80 chars)",
  "deadline": "ISO 8601 datetime string (e.g. 2026-04-10T18:00:00+00:00)",
  "priority": "low, medium, or high",
  "confidence": "how confident you are in the extraction: low, medium, or high"
}}

Rules:
1. If no date/time is mentioned, default deadline to tomorrow at 6:00 PM UTC.
2. If "today" is mentioned, use today's date at 11:59 PM UTC.
3. If "tomorrow" is mentioned, use tomorrow's date.
4. If priority words like "urgent", "important", "ASAP" appear, set priority to "high".
5. If "low priority", "whenever", "no rush" appear, set priority to "low".
6. Otherwise default priority to "medium".
7. Make the title action-oriented and clean (capitalize first letter)."""

    result = await generate_json_response(prompt)

    # Handle AI errors
    if isinstance(result, dict) and "error" in result:
        return {
            "success": False,
            "error": result["error"],
            "task": None,
        }

    # Extract fields with fallbacks
    title = result.get("title", text[:80]).strip()
    deadline = result.get("deadline", tomorrow_iso)
    priority = result.get("priority", "medium").lower()
    confidence = result.get("confidence", "medium").lower()

    # Validate priority
    if priority not in ("low", "medium", "high"):
        priority = "medium"

    # Create task document
    task_data = {
        "title": title,
        "deadline": deadline,
        "status": "pending",
        "priority": priority,
        "hours_spent": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "source": "nlp",
        "group_id": None,
    }

    inserted = tasks_collection.insert_one(task_data)
    task_data["_id"] = inserted.inserted_id

    return {
        "success": True,
        "confidence": confidence,
        "original_text": text,
        "task": {
            "id": str(task_data["_id"]),
            "title": title,
            "deadline": deadline,
            "status": "pending",
            "priority": priority,
            "completed": False,
            "hours_spent": 0.0,
            "created_at": task_data["created_at"],
            "completed_at": None,
            "source": "nlp",
            "group_id": None,
        },
    }
