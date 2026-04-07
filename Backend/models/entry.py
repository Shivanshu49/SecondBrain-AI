"""
models/entry.py — Universal Entry Schemas
Replaces "tasks" with "entries" — supports task, idea, note, goal types.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class EntryType(str, Enum):
    TASK = "task"
    IDEA = "idea"
    NOTE = "note"
    GOAL = "goal"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EntryCreate(BaseModel):
    """Schema for creating a new entry."""

    content: str = Field(
        ..., min_length=1, max_length=5000, description="Raw or structured content text"
    )
    type: EntryType = Field(
        default=EntryType.TASK, description="Entry type: task, idea, note, or goal"
    )
    deadline: Optional[str] = Field(
        default=None, description="Deadline as ISO datetime string"
    )
    priority: Optional[Priority] = Field(
        default=Priority.MEDIUM, description="Priority level"
    )
    title: Optional[str] = Field(
        default=None, max_length=200, description="Auto-generated or manual title"
    )
    source: Optional[str] = Field(
        default="manual",
        description="How created: manual, capture, ai, goal, braindump",
    )
    group_id: Optional[str] = Field(
        default=None, description="Group ID for related entries"
    )


class EntryUpdate(BaseModel):
    """Schema for updating an existing entry (all fields optional)."""

    content: Optional[str] = None
    type: Optional[EntryType] = None
    deadline: Optional[str] = None
    priority: Optional[Priority] = None
    title: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(pending|completed|archived)$")
    hours_spent: Optional[float] = Field(None, ge=0)


class EntryResponse(BaseModel):
    """Schema for entry response sent to frontend."""

    id: str = Field(..., description="MongoDB document ID as string")
    content: str
    type: str
    title: Optional[str] = None
    deadline: Optional[str] = None
    priority: str
    status: str
    completed: bool = Field(..., description="True if status is 'completed'")
    hours_spent: float = Field(default=0.0)
    created_at: str
    completed_at: Optional[str] = None
    source: str
    group_id: Optional[str] = None
    related_ids: list[str] = Field(default=[], description="IDs of related entries")


class CaptureRequest(BaseModel):
    """Universal capture input — raw text from user."""

    text: str = Field(
        ..., min_length=1, max_length=3000, description="Raw natural language input"
    )


class CaptureResponse(BaseModel):
    """Response after AI classifies and creates an entry."""

    success: bool
    entry_type: str = Field(..., description="Classified type: task, idea, note, goal")
    confidence: str = Field(default="medium", description="Classification confidence")
    original_text: str = ""
    entry: Optional[EntryResponse] = None
    error: Optional[str] = None


class InsightResponse(BaseModel):
    """Daily AI insights response."""

    success: bool
    insights: list[str] = Field(default=[], description="2-3 AI-generated insights")
    summary: str = ""
    mood: str = Field(default="neutral", description="Overall productivity mood")


class ReflectionResponse(BaseModel):
    """Brain reflection mode response."""

    success: bool
    growth_summary: str = ""
    achievements: list[str] = Field(default=[])
    patterns: list[str] = Field(default=[])
    suggestions: list[str] = Field(default=[])
    error: Optional[str] = None


class RelatedEntry(BaseModel):
    """A related entry for the connection system."""

    id: str
    title: str
    type: str
    relevance: str = Field(
        default="medium", description="How related: high, medium, low"
    )
    reason: str = ""
