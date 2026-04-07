"""
models/task.py — Task Pydantic Schemas
Enhanced with priority, hours_spent, completed flag, timestamps, source, and group_id.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    deadline: str = Field(
        ..., description="Deadline as ISO datetime string (e.g. 2026-04-10T18:00:00)"
    )
    priority: Priority = Field(
        default=Priority.MEDIUM, description="Task priority: low, medium, or high"
    )
    hours_spent: Optional[float] = Field(
        default=0.0, ge=0, description="Hours already spent on task"
    )
    source: Optional[str] = Field(
        default="manual", description="How the task was created: manual, nlp, or goal"
    )
    group_id: Optional[str] = Field(
        default=None, description="Group ID for goal-generated tasks"
    )
    type: Optional[str] = Field(
        default="task", description="Entry type: task, idea, note, or goal"
    )


class TaskUpdate(BaseModel):
    """Schema for updating an existing task (all fields optional)."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    deadline: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(pending|completed)$")
    priority: Optional[Priority] = None
    hours_spent: Optional[float] = Field(None, ge=0)


class TaskResponse(BaseModel):
    """Schema for task response sent to frontend."""

    id: str = Field(..., description="MongoDB document ID as string")
    title: str
    type: str = Field(
        default="task", description="Entry type: task, idea, note, or goal"
    )
    deadline: str
    status: str
    priority: str
    completed: bool = Field(..., description="True if status is 'completed'")
    hours_spent: float = Field(default=0.0)
    created_at: str = Field(..., description="ISO timestamp when task was created")
    completed_at: Optional[str] = Field(
        None, description="ISO timestamp when task was completed"
    )
    source: str = Field(
        default="manual", description="How the task was created: manual, nlp, or goal"
    )
    group_id: Optional[str] = Field(
        default=None, description="Group ID for goal-generated tasks"
    )
