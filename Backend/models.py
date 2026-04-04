"""
models.py — Pydantic Data Models
Defines request/response schemas for the Task entity.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    deadline: str = Field(..., description="Deadline as ISO datetime string (e.g. 2026-04-10T18:00:00)")
    status: str = Field(default="pending", description="Task status: 'pending' or 'completed'")


class TaskUpdate(BaseModel):
    """Schema for updating an existing task (all fields optional)."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    deadline: Optional[str] = None
    status: Optional[str] = None


class TaskResponse(BaseModel):
    """Schema for task response sent to frontend."""
    id: str = Field(..., description="MongoDB document ID as string")
    title: str
    deadline: str
    status: str
    created_at: str = Field(..., description="ISO timestamp when task was created")


class AIResponse(BaseModel):
    """Schema for AI-generated responses."""
    success: bool
    data: str = Field(..., description="AI-generated text content")
