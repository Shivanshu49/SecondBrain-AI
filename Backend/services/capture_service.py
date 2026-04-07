"""
services/capture_service.py — Universal AI Capture System
Classifies raw text into entry types (task/idea/note/goal) and extracts structured data.
"""

from datetime import datetime, timezone, timedelta
from ai_handler import generate_json_response
from database import entries_collection
from utils.helpers import get_today_str


async def classify_and_capture(text: str) -> dict:
    """
    Send raw user text to Gemini, classify type, extract structured fields,
    save to MongoDB entries collection, and return the created entry.
    """
    today = get_today_str()
    now_iso = datetime.now(timezone.utc).isoformat()
    tomorrow_iso = (
        (datetime.now(timezone.utc) + timedelta(days=1))
        .replace(hour=18, minute=0, second=0, microsecond=0)
        .isoformat()
    )

    prompt = f"""You are SecondBrain AI, a universal brain capture system.

Today is {today}. Current UTC time: {now_iso}

The user typed/said:
"{text}"

Your job: Classify this into ONE type and extract all relevant data.
Return a JSON object:
{{
  "type": "task OR idea OR note OR goal",
  "title": "clear, concise title (max 80 chars)",
  "content": "the full original or cleaned text",
  "deadline": "ISO 8601 datetime if a date/time is mentioned, else null",
  "priority": "low, medium, or high",
  "confidence": "low, medium, or high"
}}

Classification Rules:
1. TASK = has action + optionally deadline (e.g. "submit report Friday", "buy milk")
2. IDEA = creative thought, concept, possibility (e.g. "what if I build an app", "maybe learn guitar")
3. NOTE = information, observation, reminder without action (e.g. "the meeting is at 3pm", "Python is great")
4. GOAL = big objective, aspiration, long-term aim (e.g. "get fit", "learn programming", "save money")

Extraction Rules:
1. If no date mentioned and type=task, set deadline to null (don't default).
2. If "today" mentioned → today at 11:59 PM UTC.
3. If "tomorrow" → tomorrow at 6 PM UTC.
4. If "in X days" → X days from now at 6 PM UTC.
5. If "next week" → 7 days from now.
6. Priority: "urgent/important/ASAP" → high. "whenever/no rush/someday" → low. Else → medium.
7. Make title action-oriented for tasks, descriptive for ideas/notes/goals.
8. Content should preserve the user's original meaning."""

    result = await generate_json_response(prompt)

    if isinstance(result, dict) and "error" in result:
        return {
            "success": False,
            "error": result["error"],
            "entry_type": "note",
            "confidence": "low",
            "original_text": text,
            "entry": None,
        }

    entry_type = result.get("type", "note").lower()
    if entry_type not in ("task", "idea", "note", "goal"):
        entry_type = "note"

    title = result.get("title", text[:80]).strip()
    content = result.get("content", text).strip()
    deadline = result.get("deadline")
    priority = result.get("priority", "medium").lower()
    confidence = result.get("confidence", "medium").lower()

    if priority not in ("low", "medium", "high"):
        priority = "medium"

    entry_data = {
        "content": content,
        "type": entry_type,
        "title": title,
        "deadline": deadline,
        "priority": priority,
        "status": "pending" if entry_type == "task" else "archived",
        "hours_spent": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "source": "capture",
        "group_id": None,
        "related_ids": [],
    }

    inserted = entries_collection.insert_one(entry_data)
    entry_data["_id"] = inserted.inserted_id

    return {
        "success": True,
        "entry_type": entry_type,
        "confidence": confidence,
        "original_text": text,
        "entry": {
            "id": str(entry_data["_id"]),
            "content": content,
            "type": entry_type,
            "title": title,
            "deadline": deadline,
            "priority": priority,
            "status": entry_data["status"],
            "completed": entry_data["status"] == "completed",
            "hours_spent": 0.0,
            "created_at": entry_data["created_at"],
            "completed_at": None,
            "source": "capture",
            "group_id": None,
            "related_ids": [],
        },
    }
