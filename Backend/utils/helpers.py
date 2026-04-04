"""
utils/helpers.py — Shared Utility Functions
Scoring, sorting, formatting, and date parsing helpers.
"""

from datetime import datetime, timezone
from typing import Optional


PRIORITY_WEIGHTS = {"high": 3, "medium": 2, "low": 1}


def priority_to_int(priority: str) -> int:
    """Convert priority string to numeric weight for sorting."""
    return PRIORITY_WEIGHTS.get(priority.lower(), 2)


def parse_deadline(deadline_str: str) -> Optional[datetime]:
    """Safely parse an ISO deadline string into a timezone-aware datetime."""
    try:
        dt = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def hours_until_deadline(deadline_str: str) -> Optional[float]:
    """Calculate hours remaining until a deadline. Negative = overdue."""
    dt = parse_deadline(deadline_str)
    if dt is None:
        return None
    now = datetime.now(timezone.utc)
    return (dt - now).total_seconds() / 3600


def format_tasks_for_prompt(tasks: list[dict]) -> str:
    """Convert task documents into a readable string for AI prompts."""
    if not tasks:
        return "No pending tasks found."

    lines = []
    for i, task in enumerate(tasks, 1):
        priority = task.get("priority", "medium").upper()
        hours = task.get("hours_spent", 0)
        hours_left = hours_until_deadline(task.get("deadline", ""))
        urgency = ""
        if hours_left is not None:
            if hours_left < 0:
                urgency = " ⚠️ OVERDUE"
            elif hours_left < 24:
                urgency = " 🔴 DUE SOON"
            elif hours_left < 72:
                urgency = " 🟡 UPCOMING"

        lines.append(
            f'{i}. "{task["title"]}" — Priority: {priority} | '
            f'Deadline: {task["deadline"]} | Hours spent: {hours}{urgency}'
        )
    return "\n".join(lines)


def get_today_str() -> str:
    """Get today's date as a human-readable string."""
    return datetime.now(timezone.utc).strftime("%A, %B %d, %Y")
