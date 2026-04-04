"""
routes/tasks.py — Task CRUD API Endpoints
Handles creating, reading, updating, and deleting tasks.
"""

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone

from database import tasks_collection
from models import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def task_to_response(task: dict) -> dict:
    """Convert a MongoDB document to a clean response dict."""
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "deadline": task["deadline"],
        "status": task["status"],
        "created_at": task["created_at"],
    }


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(task: TaskCreate):
    """Create a new task and store it in the database."""
    task_data = {
        "title": task.title,
        "deadline": task.deadline,
        "status": task.status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = tasks_collection.insert_one(task_data)
    task_data["_id"] = result.inserted_id

    return task_to_response(task_data)


@router.get("", response_model=list[TaskResponse])
async def get_all_tasks():
    """Fetch all tasks from the database."""
    tasks = list(tasks_collection.find().sort("created_at", -1))
    return [task_to_response(task) for task in tasks]


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate):
    """Update an existing task by ID."""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    # Build update dict with only provided fields
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    result = tasks_collection.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": update_data},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task_to_response(result)


@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task by ID."""
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID format.")

    result = tasks_collection.delete_one({"_id": ObjectId(task_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found.")

    return {"success": True, "message": f"Task {task_id} deleted successfully."}
