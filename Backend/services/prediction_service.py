"""
services/prediction_service.py — Life Prediction Engine
Predicts whether the user will complete their tasks and provides guidance.
Uses actual task data to calculate data-driven confidence before AI analysis.
"""

from database import tasks_collection, entries_collection
from ai_handler import generate_response
from utils.helpers import format_tasks_for_prompt, hours_until_deadline, get_today_str
from services.score_service import calculate_life_score


async def predict_outcomes(user_id: str = None) -> dict:
    """
    Collect task data from both collections and behavioral patterns, then ask Gemini
    to predict success/failure and provide suggestions.
    """
    query = {"status": "pending"}
    if user_id:
        query["user_id"] = user_id
    pending = list(tasks_collection.find(query))
    c_query = {"status": "completed"}
    if user_id:
        c_query["user_id"] = user_id
    completed = list(tasks_collection.find(c_query))

    e_pend = {"type": "task", "status": "pending"}
    e_comp = {"type": "task", "status": "completed"}
    if user_id:
        e_pend["user_id"] = user_id
        e_comp["user_id"] = user_id
    task_entries_pending = list(entries_collection.find(e_pend))
    task_entries_completed = list(entries_collection.find(e_comp))
    pending.extend(task_entries_pending)
    completed.extend(task_entries_completed)

    total_pending = len(pending)
    total_completed = len(completed)
    total = total_pending + total_completed

    # ── Edge case: No tasks at all ──
    if total == 0:
        return {
            "success": True,
            "prediction": "neutral",
            "confidence": 0,
            "summary": "No tasks to analyze yet. Add some tasks to get predictions!",
            "suggestions": ["Start by adding your first task."],
        }

    # ── Edge case: All done, no pending ──
    if total_pending == 0 and total_completed > 0:
        return {
            "success": True,
            "prediction": "success",
            "confidence": 95,
            "summary": f"Amazing! You've completed all {total_completed} tasks with nothing pending. Keep up the momentum!",
            "suggestions": ["Set new goals to maintain your streak.", "Challenge yourself with harder tasks."],
        }

    score_data = calculate_life_score(user_id)

    # ── Calculate data-driven confidence ──
    confidence_pct = _calculate_confidence(score_data, pending, completed)

    # ── Determine prediction from data ──
    if score_data["completion_rate"] >= 70 and score_data["missed_tasks"] == 0:
        prediction = "success"
    elif score_data["completion_rate"] >= 40 or score_data["missed_tasks"] <= 1:
        prediction = "partial"
    else:
        prediction = "failure"

    task_text = format_tasks_for_prompt(pending)
    today = get_today_str()

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

Based on the data, the prediction is: {prediction.upper()}
Confidence: {confidence_pct}%

Your job:
1. Give a 2-3 sentence assessment of their situation based on the data.
2. List 3 specific, actionable suggestions to improve their outcomes.

Format your response as:
SUMMARY: [your 2-3 sentence assessment]
SUGGESTIONS:
1. [suggestion 1]
2. [suggestion 2]
3. [suggestion 3]"""

    try:
        result = await generate_response(prompt)
    except Exception as e:
        print(f"⚠️ Prediction AI call failed: {e}")
        result = None

    # If AI returned a rate-limit message or failed, use data-driven fallback
    if not result or "rate-limited" in str(result).lower() or "⏳" in str(result):
        fallback_summaries = {
            "success": f"Great work! You've completed {score_data['completed_tasks']} of {score_data['total_tasks']} tasks ({score_data['completion_rate']}% rate). Keep the momentum going!",
            "partial": f"You have {score_data['pending_tasks']} pending tasks with a {score_data['completion_rate']}% completion rate. Focus on your overdue items to improve.",
            "failure": f"Heads up — {score_data['missed_tasks']} tasks are overdue and your completion rate is {score_data['completion_rate']}%. Time to prioritize and knock out the urgent ones.",
        }
        fallback_suggestions = {
            "success": ["Set new goals to maintain your streak.", "Challenge yourself with harder tasks.", "Help a friend stay productive too."],
            "partial": ["Focus on overdue items first.", "Break larger tasks into smaller steps.", "Set aside dedicated focus time."],
            "failure": ["Start with your most overdue task.", "Clear 2 quick wins to build momentum.", "Review and remove tasks you won't do."],
        }
        return {
            "success": True,
            "prediction": prediction,
            "confidence": confidence_pct,
            "summary": fallback_summaries.get(prediction, fallback_summaries["partial"]),
            "suggestions": fallback_suggestions.get(prediction, fallback_suggestions["partial"]),
        }

    # Parse the AI response for summary and suggestions
    summary = result
    suggestions = []

    lines = result.split("\n")
    in_suggestions = False
    for line in lines:
        if "SUGGESTIONS:" in line.upper():
            in_suggestions = True
            continue
        if in_suggestions and line.strip():
            cleaned = line.strip().lstrip("0123456789.-) ").strip()
            if cleaned:
                suggestions.append(cleaned)

    # Extract summary if formatted
    for line in lines:
        if line.strip().upper().startswith("SUMMARY:"):
            summary = line.split(":", 1)[1].strip()
            break

    return {
        "success": True,
        "prediction": prediction,
        "confidence": confidence_pct,
        "summary": summary,
        "suggestions": suggestions[:5] if suggestions else ["Keep working on your tasks!", "Focus on overdue items first."],
    }


def _calculate_confidence(score_data: dict, pending: list, completed: list) -> int:
    """
    Calculate a data-driven confidence percentage (0–100).
    Based on:
    - Completion rate (how much has user actually done)
    - Streak (consistency indicator)
    - Overdue ratio (risk factor)
    - Total data points (more data = more confident in prediction)
    """
    total = score_data["total_tasks"]
    if total == 0:
        return 0

    # Factor 1: Completion rate contributes up to 40 points
    completion_factor = (score_data["completion_rate"] / 100) * 40

    # Factor 2: Streak contributes up to 20 points (7+ day streak = max)
    streak_factor = min(score_data["streak"] / 7 * 20, 20)

    # Factor 3: Low overdue ratio contributes up to 20 points
    pending_count = len(pending)
    if pending_count > 0:
        overdue_ratio = score_data["missed_tasks"] / pending_count
        overdue_factor = max(0, (1 - overdue_ratio) * 20)
    else:
        overdue_factor = 20  # No pending = no overdue risk

    # Factor 4: Data volume contributes up to 20 points (more tasks = more data)
    data_factor = min(total / 10 * 20, 20)  # 10+ tasks = max confidence

    confidence = round(completion_factor + streak_factor + overdue_factor + data_factor)
    return max(5, min(100, confidence))  # Floor at 5% (never show 0% if tasks exist)
