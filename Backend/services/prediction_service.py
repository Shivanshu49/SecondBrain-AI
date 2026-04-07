"""
services/prediction_service.py — Life Prediction Engine
Predicts whether the user will complete their tasks and provides guidance.
"""

from database import tasks_collection, entries_collection
from ai_handler import generate_response
from utils.helpers import format_tasks_for_prompt, hours_until_deadline, get_today_str
from services.score_service import calculate_life_score


async def predict_outcomes() -> dict:
    """
    Collect task data from both collections and behavioral patterns, then ask Gemini
    to predict success/failure and provide suggestions.
    """
    pending = list(tasks_collection.find({"status": "pending"}))
    completed = list(tasks_collection.find({"status": "completed"}))

    task_entries_pending = list(
        entries_collection.find({"type": "task", "status": "pending"})
    )
    task_entries_completed = list(
        entries_collection.find({"type": "task", "status": "completed"})
    )
    pending.extend(task_entries_pending)
    completed.extend(task_entries_completed)
    score_data = calculate_life_score()

    if len(pending) == 0 and len(completed) == 0:
        return {
            "success": True,
            "prediction": "neutral",
            "confidence": "low",
            "summary": "No tasks to analyze yet. Add some tasks to get predictions!",
            "suggestions": ["Start by adding your first task."],
        }

    task_text = format_tasks_for_prompt(pending)
    today = get_today_str()

    # Build behavioral context
    context = f"""USER STATS:
- Total tasks: {score_data["total_tasks"]}
- Completed: {score_data["completed_tasks"]}
- Pending: {score_data["pending_tasks"]}
- Completion rate: {score_data["completion_rate"]}%
- Current streak: {score_data["streak"]} days
- Missed/overdue tasks: {score_data["missed_tasks"]}
- Productivity score: {score_data["score"]}/100

PENDING TASKS:
{task_text}"""

    prompt = f"""You are SecondBrain AI, a life prediction engine.

Today is {today}.

Here is the user's complete task data and behavioral analysis:
{context}

Your job:
1. PREDICT: Will this user successfully complete their pending tasks? Answer: SUCCESS, PARTIAL, or FAILURE.
2. CONFIDENCE: How confident are you? Answer: LOW, MEDIUM, or HIGH.
3. SUMMARY: Give a 2-3 sentence assessment of their situation.
4. SUGGESTIONS: List 3 specific, actionable suggestions to improve their outcomes.

Format your response EXACTLY like this:
PREDICTION: [SUCCESS/PARTIAL/FAILURE]
CONFIDENCE: [LOW/MEDIUM/HIGH]
SUMMARY: [your assessment]
SUGGESTIONS:
1. [suggestion 1]
2. [suggestion 2]
3. [suggestion 3]"""

    result = await generate_response(prompt)

    # Parse the response
    prediction = "partial"
    confidence = "medium"
    suggestions = []

    lines = result.split("\n")
    for line in lines:
        line_upper = line.strip().upper()
        if line_upper.startswith("PREDICTION:"):
            val = line.split(":", 1)[1].strip().upper()
            if "SUCCESS" in val:
                prediction = "success"
            elif "FAILURE" in val:
                prediction = "failure"
            else:
                prediction = "partial"
        elif line_upper.startswith("CONFIDENCE:"):
            val = line.split(":", 1)[1].strip().upper()
            if "HIGH" in val:
                confidence = "high"
            elif "LOW" in val:
                confidence = "low"
            else:
                confidence = "medium"

    # Extract suggestions (numbered lines after SUGGESTIONS:)
    in_suggestions = False
    for line in lines:
        if "SUGGESTIONS:" in line.upper():
            in_suggestions = True
            continue
        if in_suggestions and line.strip():
            # Remove leading numbers like "1. " or "- "
            cleaned = line.strip().lstrip("0123456789.-) ").strip()
            if cleaned:
                suggestions.append(cleaned)

    return {
        "success": True,
        "prediction": prediction,
        "confidence": confidence,
        "summary": result,
        "suggestions": suggestions[:5],
    }
