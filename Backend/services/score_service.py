"""
services/score_service.py — Life Score Calculator
Computes productivity score, streaks, consistency, and missed tasks.
Properly calculates based on user's actual task completion data.
"""

from datetime import datetime, timezone, timedelta
from database import tasks_collection, entries_collection
from utils.helpers import parse_deadline


def calculate_life_score(user_id: str = None) -> dict:
    """
    Calculate the user's overall life/productivity score.
    Combines tasks collection and entry-type tasks.

    Score formula:
    - Base: completion_rate (0–100)
    - Streak bonus: +up to 15 points for consistent daily completions
    - Consistency bonus: +up to 10 points for recent activity
    - Overdue penalty: -5 per overdue task (capped at -25)
    - Minimum score is 0 when no tasks exist, not artificially inflated
    """
    query = {"user_id": user_id} if user_id else {}
    all_tasks = list(tasks_collection.find(query))
    entry_query = {"type": "task", **(query)}
    task_entries = list(entries_collection.find(entry_query))

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

    # Completion rate (0–100)
    completion_rate = round((completed_count / total) * 100, 1)

    # Missed/overdue tasks — pending and past deadline
    now = datetime.now(timezone.utc)
    missed = 0
    for task in pending:
        dl = parse_deadline(task.get("deadline", ""))
        if dl and dl < now:
            missed += 1

    # Streak — consecutive days with at least 1 completion
    streak = _calculate_streak(completed)

    # Consistency score (0–100) based on streak and recent activity
    consistency = _calculate_consistency(completed, streak)

    # ── Score Calculation ──
    # Base: completion rate drives the score (0–100 range)
    # Streak bonus: up to +15 for 7+ day streak
    # Consistency bonus: up to +10 for high recent activity
    # Overdue penalty: -5 per overdue task (max -25)

    streak_bonus = min(streak * 2, 15)           # 0–15 points
    consistency_bonus = min(consistency / 10, 10) # 0–10 points
    overdue_penalty = min(missed * 5, 25)         # 0–25 penalty

    raw_score = completion_rate + streak_bonus + consistency_bonus - overdue_penalty
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

    completion_dates = set()
    for task in completed_tasks:
        completed_at = task.get("completed_at")
        if completed_at:
            dt = parse_deadline(completed_at)
            if dt:
                completion_dates.add(dt.date())
        else:
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
