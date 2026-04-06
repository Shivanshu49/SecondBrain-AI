"""
services/braindump_service.py — Brain Dump / Mental Overload System
Categorizes user's raw thoughts into urgent, later, and ignore buckets.
"""

from ai_handler import generate_json_response


async def process_brain_dump(text: str) -> dict:
    """
    Take a block of freeform text (thoughts, worries, ideas),
    send to Gemini to categorize into urgent/later/ignore.
    """
    prompt = f"""You are SecondBrain AI, a mental clarity assistant.

The user dumped their thoughts:
"{text}"

Your job: Categorize each distinct thought/item into exactly ONE of these buckets:

Return a JSON object:
{{
  "summary": "a one-line summary of the user's mental state",
  "urgent": [
    {{"item": "thought text", "reason": "why it's urgent"}}
  ],
  "later": [
    {{"item": "thought text", "reason": "why it can wait"}}
  ],
  "ignore": [
    {{"item": "thought text", "reason": "why it can be ignored"}}
  ]
}}

Rules:
1. URGENT = needs action within 24 hours, has deadlines, or is critical.
2. LATER = important but not time-sensitive, can be scheduled for later.
3. IGNORE = noise, overthinking, things out of user's control, or unactionable.
4. Each item should be a clear, concise rephrasing of the thought.
5. Include a brief reason (1 sentence) for each categorization.
6. Be empathetic in the summary — this is a brain cleanup tool.
7. If the input has only 1-2 thoughts, still categorize them properly."""

    result = await generate_json_response(prompt)

    # Handle errors
    if isinstance(result, dict) and "error" in result:
        return {
            "success": False,
            "error": result["error"],
            "summary": "",
            "urgent": [],
            "later": [],
            "ignore": [],
        }

    summary = result.get("summary", "Here's how I organized your thoughts.")
    urgent = result.get("urgent", [])
    later = result.get("later", [])
    ignore = result.get("ignore", [])

    # Normalize items
    def normalize_items(items):
        normalized = []
        for item in (items if isinstance(items, list) else []):
            if isinstance(item, dict):
                normalized.append({
                    "item": item.get("item", str(item)),
                    "reason": item.get("reason", ""),
                })
            elif isinstance(item, str):
                normalized.append({"item": item, "reason": ""})
        return normalized

    return {
        "success": True,
        "summary": summary,
        "urgent": normalize_items(urgent),
        "later": normalize_items(later),
        "ignore": normalize_items(ignore),
    }
