"""
routes/entries.py — Entry CRUD API Endpoints
Handles the new universal entry system (task/idea/note/goal).
"""

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from pymongo import ReturnDocument
from datetime import datetime, timezone
from typing import Optional

from database import entries_collection
from models.entry import EntryCreate, EntryUpdate, EntryResponse
from utils.helpers import priority_to_int

router = APIRouter(prefix="/api/entries", tags=["Entries"])


def entry_to_response(entry: dict) -> dict:
    """Convert a MongoDB document to a clean response dict."""
    return {
        "id": str(entry["_id"]),
        "content": entry.get("content", ""),
        "type": entry.get("type", "note"),
        "title": entry.get("title"),
        "deadline": entry.get("deadline"),
        "priority": entry.get("priority", "medium"),
        "status": entry.get("status", "pending"),
        "completed": entry.get("status") == "completed",
        "hours_spent": entry.get("hours_spent", 0.0),
        "created_at": entry.get("created_at", ""),
        "completed_at": entry.get("completed_at"),
        "source": entry.get("source", "manual"),
        "group_id": entry.get("group_id"),
        "related_ids": entry.get("related_ids", []),
    }


@router.post("", response_model=EntryResponse, status_code=201)
async def create_entry(entry: EntryCreate):
    """Create a new entry (task/idea/note/goal)."""
    entry_data = {
        "content": entry.content,
        "type": entry.type.value,
        "title": entry.title or entry.content[:80],
        "deadline": entry.deadline,
        "priority": entry.priority.value if entry.priority else "medium",
        "status": "pending" if entry.type.value == "task" else "archived",
        "hours_spent": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "source": entry.source or "manual",
        "group_id": entry.group_id,
        "related_ids": [],
    }

    result = entries_collection.insert_one(entry_data)
    entry_data["_id"] = result.inserted_id

    return entry_to_response(entry_data)


@router.get("", response_model=list[EntryResponse])
async def get_all_entries(
    type: Optional[str] = Query(
        None, description="Filter by type: task, idea, note, goal"
    ),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: Optional[str] = Query(None, description="Sort field"),
    order: Optional[str] = Query("desc", description="Sort order"),
):
    """Fetch entries with optional filtering and sorting."""
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status

    entries = list(entries_collection.find(query))

    if sort_by == "priority":
        reverse = order == "desc"
        entries.sort(
            key=lambda e: priority_to_int(e.get("priority", "medium")), reverse=reverse
        )
    elif sort_by in ("deadline", "created_at"):
        reverse = order == "desc"
        entries.sort(key=lambda e: e.get(sort_by, ""), reverse=reverse)
    else:
        entries.sort(key=lambda e: e.get("created_at", ""), reverse=True)

    return [entry_to_response(e) for e in entries]


@router.get("/{entry_id}", response_model=EntryResponse)
async def get_entry(entry_id: str):
    """Get a single entry by ID."""
    if not ObjectId.is_valid(entry_id):
        raise HTTPException(status_code=400, detail="Invalid entry ID format.")

    entry = entries_collection.find_one({"_id": ObjectId(entry_id)})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found.")

    return entry_to_response(entry)


@router.patch("/{entry_id}", response_model=EntryResponse)
async def update_entry(entry_id: str, entry_update: EntryUpdate):
    """Update an existing entry by ID."""
    if not ObjectId.is_valid(entry_id):
        raise HTTPException(status_code=400, detail="Invalid entry ID format.")

    update_data = {}
    for k, v in entry_update.model_dump().items():
        if v is not None:
            if hasattr(v, "value"):
                update_data[k] = v.value
            else:
                update_data[k] = v

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    if update_data.get("status") == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif update_data.get("status") == "pending":
        update_data["completed_at"] = None

    result = entries_collection.find_one_and_update(
        {"_id": ObjectId(entry_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Entry not found.")

    return entry_to_response(result)


@router.delete("/{entry_id}")
async def delete_entry(entry_id: str):
    """Delete an entry by ID."""
    if not ObjectId.is_valid(entry_id):
        raise HTTPException(status_code=400, detail="Invalid entry ID format.")

    result = entries_collection.delete_one({"_id": ObjectId(entry_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found.")

    return {"success": True, "message": f"Entry {entry_id} deleted successfully."}
