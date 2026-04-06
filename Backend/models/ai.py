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


# ─────────────────────────────────────────────
# NEW: NLP Quick Capture
# ─────────────────────────────────────────────
class NLPCaptureRequest(BaseModel):
    """Input for NLP task capture."""
    text: str = Field(..., min_length=2, max_length=500, description="Natural language task input")


class NLPCaptureTaskDetail(BaseModel):
    """Task detail returned from NLP capture."""
    id: str
    title: str
    deadline: str
    status: str
    priority: str
    completed: bool
    hours_spent: float = 0.0
    created_at: str
    completed_at: Optional[str] = None
    source: str = "nlp"
    group_id: Optional[str] = None


class NLPCaptureResponse(BaseModel):
    """NLP Quick Capture response."""
    success: bool
    confidence: str = Field(default="medium", description="Extraction confidence: low, medium, or high")
    original_text: str = ""
    error: Optional[str] = None
    task: Optional[NLPCaptureTaskDetail] = None


# ─────────────────────────────────────────────
# NEW: Goal Decomposition
# ─────────────────────────────────────────────
class GoalRequest(BaseModel):
    """Input for goal decomposition."""
    goal: str = Field(..., min_length=3, max_length=500, description="Big goal to decompose into tasks")


class GoalTaskDetail(BaseModel):
    """Single task generated from a goal."""
    id: str
    title: str
    deadline: str
    status: str
    priority: str
    completed: bool = False
    hours_spent: float = 0.0
    created_at: str
    completed_at: Optional[str] = None
    source: str = "goal"
    group_id: Optional[str] = None
    order: int = 1


class GoalResponse(BaseModel):
    """Goal decomposition response."""
    success: bool
    goal_summary: str = ""
    group_id: Optional[str] = None
    error: Optional[str] = None
    tasks: list[GoalTaskDetail] = []


# ─────────────────────────────────────────────
# NEW: Brain Dump
# ─────────────────────────────────────────────
class BrainDumpRequest(BaseModel):
    """Input for brain dump / mental overload."""
    text: str = Field(..., min_length=3, max_length=3000, description="Raw stream of thoughts")


class BrainDumpItem(BaseModel):
    """Single categorized thought item."""
    item: str
    reason: str = ""


class BrainDumpResponse(BaseModel):
    """Brain dump categorization response."""
    success: bool
    summary: str = ""
    error: Optional[str] = None
    urgent: list[BrainDumpItem] = []
    later: list[BrainDumpItem] = []
    ignore: list[BrainDumpItem] = []
