"""
routes/tasks.py — Task CRUD API Endpoints
Handles creating, reading, updating, and deleting tasks.
Supports filtering by status, sorting by deadline/priority.
"""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from pymongo import ReturnDocument
from datetime import datetime, timezone
from typing import Optional

from database import tasks_collection
from models.task import TaskCreate, TaskUpdate, TaskResponse
from utils.helpers import priority_to_int

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def task_to_response(task: dict) -> dict:
    """Convert a MongoDB document to a clean response dict."""
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "deadline": task["deadline"],
        "status": task.get("status", "pending"),
        "priority": task.get("priority", "medium"),
        "completed": task.get("status") == "completed",
        "hours_spent": task.get("hours_spent", 0.0),
        "created_at": task.get("created_at", ""),
        "completed_at": task.get("completed_at"),
    }


# ─────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────
@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(task: TaskCreate):
    """Create a new task and store it in the database."""
    task_data = {
        "title": task.title,
        "deadline": task.deadline,
        "status": "pending",
        "priority": task.priority.value,
        "hours_spent": task.hours_spent or 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
    }

    result = tasks_collection.insert_one(task_data)
    task_data["_id"] = result.inserted_id

    return task_to_response(task_data)


# ─────────────────────────────────────────────
# READ — with filtering & sorting
# ─────────────────────────────────────────────
@router.get("", response_model=list[TaskResponse])
async def get_all_tasks(
    status: Optional[str] = Query(None, pattern="^(pending|completed)$", description="Filter by status"),
    sort_by: Optional[str] = Query(None, pattern="^(deadline|priority|created_at)$", description="Sort field"),
    order: Optional[str] = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
):
    """Fetch tasks with optional filtering and sorting."""
    # Build query filter
    query = {}
    if status:
        query["status"] = status

    # Fetch from DB
    tasks = list(tasks_collection.find(query))

    # Sort in Python (supports priority which needs custom ordering)
    if sort_by == "priority":
        reverse = order == "desc"
        tasks.sort(key=lambda t: priority_to_int(t.get("priority", "medium")), reverse=reverse)
    elif sort_by == "deadline":
        reverse = order == "desc"
        tasks.sort(key=lambda t: t.get("deadline", ""), reverse=reverse)
    elif sort_by == "created_at":
        reverse = order == "desc"
        tasks.sort(key=lambda t: t.get("created_at", ""), reverse=reverse)
    else:
        # Default: newest first
        tasks.sort(key=lambda t: t.get("created_at", ""), reverse=True)

    return [task_to_response(task) for task in tasks]


# ─────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────
@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate):
    """Update an existing task by ID."""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    # Build update dict with only provided fields
    update_data = {}
    for k, v in task_update.model_dump().items():
        if v is not None:
            if k == "priority":
                update_data[k] = v.value if hasattr(v, "value") else v
            else:
                update_data[k] = v

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Stamp completed_at when marking as completed
    if update_data.get("status") == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif update_data.get("status") == "pending":
        update_data["completed_at"] = None

    result = tasks_collection.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task_to_response(result)


# ─────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────
@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task by ID."""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    result = tasks_collection.delete_one({"_id": ObjectId(task_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found.")

    return {"success": True, "message": f"Task {task_id} deleted successfully."}
