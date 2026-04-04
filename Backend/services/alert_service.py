"""
services/alert_service.py — Failure Alert System
Detects risky patterns and generates severity-based alerts.
"""

from datetime import datetime, timezone
from database import tasks_collection
from utils.helpers import parse_deadline, hours_until_deadline


def check_alerts() -> dict:
    """
    Analyze user's tasks and generate failure alerts.

    Returns a dict with: has_alerts, alerts (list of {message, severity}),
    and context data for AI summary generation.
    """
    all_tasks = list(tasks_collection.find())
    pending = [t for t in all_tasks if t.get("status") == "pending"]
    completed = [t for t in all_tasks if t.get("status") == "completed"]

    total = len(all_tasks)
    alerts = []

    if total == 0:
        return {"has_alerts": False, "alerts": [], "context": "No tasks exist yet."}

    completion_rate = (len(completed) / total) * 100 if total > 0 else 0

    # ── Condition 1: Low completion rate ──
    if completion_rate < 40 and total >= 3:
        alerts.append({
            "message": f"⚠️ Your completion rate is only {completion_rate:.0f}%. You're falling behind!",
            "severity": "high",
        })

    # ── Condition 2: Too many pending tasks ──
    if len(pending) >= 8:
        alerts.append({
            "message": f"📋 You have {len(pending)} pending tasks. Consider prioritizing or removing some.",
            "severity": "medium",
        })
    elif len(pending) >= 5:
        alerts.append({
            "message": f"📋 You have {len(pending)} pending tasks piling up.",
            "severity": "low",
        })

    # ── Condition 3: Overdue tasks ──
    now = datetime.now(timezone.utc)
    overdue_tasks = []
    urgent_tasks = []  # Due within 24h

    for task in pending:
        h = hours_until_deadline(task.get("deadline", ""))
        if h is not None:
            if h < 0:
                overdue_tasks.append(task["title"])
            elif h <= 24:
                urgent_tasks.append(task["title"])

    if overdue_tasks:
        names = ", ".join(f'"{t}"' for t in overdue_tasks[:3])
        extra = f" (+{len(overdue_tasks) - 3} more)" if len(overdue_tasks) > 3 else ""
        alerts.append({
            "message": f"🔴 OVERDUE: {names}{extra}. These tasks are past their deadline!",
            "severity": "critical",
        })

    if urgent_tasks:
        names = ", ".join(f'"{t}"' for t in urgent_tasks[:3])
        extra = f" (+{len(urgent_tasks) - 3} more)" if len(urgent_tasks) > 3 else ""
        alerts.append({
            "message": f"🟠 DUE SOON: {names}{extra}. Less than 24 hours remaining!",
            "severity": "high",
        })

    # ── Condition 4: No recent completions ──
    from datetime import timedelta
    recent_completed = [
        t for t in completed
        if parse_deadline(t.get("completed_at") or t.get("created_at", ""))
        and parse_deadline(t.get("completed_at") or t.get("created_at", "")) >= now - timedelta(days=3)
    ]

    if len(completed) > 0 and len(recent_completed) == 0 and len(pending) > 0:
        alerts.append({
            "message": "😴 You haven't completed anything in the last 3 days. Time to get moving!",
            "severity": "medium",
        })

    # Build context summary for AI
    context = _build_context(total, len(completed), len(pending), completion_rate, 
                              overdue_tasks, urgent_tasks)

    return {
        "has_alerts": len(alerts) > 0,
        "alerts": alerts,
        "context": context,
    }


def _build_context(total, completed, pending, rate, overdue, urgent) -> str:
    """Build a text summary of the alert situation for AI processing."""
    parts = [
        f"Total tasks: {total}",
        f"Completed: {completed}",
        f"Pending: {pending}",
        f"Completion rate: {rate:.1f}%",
    ]
    if overdue:
        parts.append(f"Overdue tasks ({len(overdue)}): {', '.join(overdue[:5])}")
    if urgent:
        parts.append(f"Urgent tasks ({len(urgent)}): {', '.join(urgent[:5])}")
    return "\n".join(parts)
