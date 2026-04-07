"""
services/score_service.py — Life Score Calculator
Computes productivity score, streaks, consistency, and missed tasks.
"""

from datetime import datetime, timezone, timedelta
from database import tasks_collection, entries_collection
from utils.helpers import parse_deadline


def calculate_life_score() -> dict:
    """
    Calculate the user's overall life/productivity score.
    Now includes both tasks and entry-type tasks.
    """
    all_tasks = list(tasks_collection.find())
    task_entries = list(entries_collection.find({"type": "task"}))

    all_tasks.extend(task_entries)
    total = len(all_tasks)

    if total == 0:
        return {
            "score": 0,
            "total_tasks": 0,
            "completed_tasks": 0,
            "pending_tasks": 0,
            "completion_rate": 0.0,
            "streak": 0,
            "consistency_score": 0,
            "missed_tasks": 0,
        }

    completed = [t for t in all_tasks if t.get("status") == "completed"]
    pending = [t for t in all_tasks if t.get("status") == "pending"]
    completed_count = len(completed)
    pending_count = len(pending)

    # Completion rate
    completion_rate = round((completed_count / total) * 100, 1)

    # Missed tasks — pending and past deadline
    now = datetime.now(timezone.utc)
    missed = 0
    for task in pending:
        dl = parse_deadline(task.get("deadline", ""))
        if dl and dl < now:
            missed += 1

    # Streak — consecutive days (going backwards) with at least 1 completion
    streak = _calculate_streak(completed)

    # Consistency score (0–100) based on streak and recent activity
    consistency = _calculate_consistency(completed, streak)

    # Overall score: weighted formula
    #   50% completion rate + 25% consistency + 25% penalty for missed
    missed_penalty = min(missed * 5, 25)  # cap at 25 points deduction
    raw_score = (
        (completion_rate * 0.50) + (consistency * 0.25) + max(0, 25 - missed_penalty)
    )
    score = max(0, min(100, round(raw_score)))

    return {
        "score": score,
        "total_tasks": total,
        "completed_tasks": completed_count,
        "pending_tasks": pending_count,
        "completion_rate": completion_rate,
        "streak": streak,
        "consistency_score": consistency,
        "missed_tasks": missed,
    }


def _calculate_streak(completed_tasks: list[dict]) -> int:
    """Count consecutive days (backwards from today) with at least 1 completed task."""
    if not completed_tasks:
        return 0

    # Collect completion dates
    completion_dates = set()
    for task in completed_tasks:
        completed_at = task.get("completed_at")
        if completed_at:
            dt = parse_deadline(completed_at)
            if dt:
                completion_dates.add(dt.date())
        else:
            # Fallback: use created_at if completed_at is missing
            created = parse_deadline(task.get("created_at", ""))
            if created:
                completion_dates.add(created.date())

    if not completion_dates:
        return 0

    today = datetime.now(timezone.utc).date()
    streak = 0
    check_date = today

    while check_date in completion_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak


def _calculate_consistency(completed_tasks: list[dict], streak: int) -> int:
    """
    Calculate consistency score (0–100).
    Based on: streak length + tasks completed in last 7 days.
    """
    if not completed_tasks:
        return 0

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    recent_completions = 0
    for task in completed_tasks:
        completed_at = task.get("completed_at") or task.get("created_at", "")
        dt = parse_deadline(completed_at)
        if dt and dt >= week_ago:
            recent_completions += 1

    # Streak component (max 50 points for 7-day streak)
    streak_score = min(streak / 7 * 50, 50)

    # Recent activity component (max 50 points for 7+ tasks in a week)
    activity_score = min(recent_completions / 7 * 50, 50)

    return round(streak_score + activity_score)
