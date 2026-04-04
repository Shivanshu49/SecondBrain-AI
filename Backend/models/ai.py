"""
models/ai.py — AI Response Schemas
Structured response models for all AI-powered endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional


class AIResponse(BaseModel):
    """Generic AI text response."""
    success: bool
    data: str = Field(..., description="AI-generated text content")


class ScoreResponse(BaseModel):
    """Life Score + productivity stats."""
    score: int = Field(..., ge=0, le=100, description="Overall productivity score (0–100)")
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float = Field(..., description="Completion rate as percentage")
    streak: int = Field(default=0, description="Consecutive days with completed tasks")
    consistency_score: int = Field(default=0, ge=0, le=100)
    missed_tasks: int = Field(default=0, description="Overdue incomplete tasks")


class AlertDetail(BaseModel):
    """Single alert item."""
    message: str
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")


class AlertResponse(BaseModel):
    """Failure alert system response."""
    has_alerts: bool
    alerts: list[AlertDetail] = []
    ai_summary: str = Field(default="", description="AI-generated summary of the situation")


class DecisionResponse(BaseModel):
    """Autonomous decision engine response."""
    success: bool
    selected_task: Optional[str] = None
    task_id: Optional[str] = None
    reason: str = ""
    alternatives: list[str] = []


class PredictionResponse(BaseModel):
    """Life prediction engine response."""
    success: bool
    prediction: str = Field(default="", description="success or failure")
    confidence: str = Field(default="", description="low, medium, or high")
    summary: str = ""
    suggestions: list[str] = []


class ScheduleSlot(BaseModel):
    """Single time block in a schedule."""
    time: str = Field(..., description="Time range, e.g. '9:00 AM - 10:30 AM'")
    task: str
    priority: str = ""


class ScheduleResponse(BaseModel):
    """Auto scheduler response."""
    success: bool
    schedule: list[ScheduleSlot] = []
    ai_notes: str = ""


class MentalStateRequest(BaseModel):
    """Input for mental state detection."""
    text: str = Field(..., min_length=1, max_length=2000, description="User's text input (journal, chat, note)")


class MentalStateResponse(BaseModel):
    """Mental state detection response."""
    success: bool
    emotion: str = ""
    intensity: str = Field(default="", description="low, medium, or high")
    suggestion: str = ""
    ai_response: str = ""
