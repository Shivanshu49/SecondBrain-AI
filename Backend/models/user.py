"""
models/user.py — User Authentication Schemas
Pydantic models for signup, login, and user responses.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class UserSignup(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=2, max_length=100, description="Full name")
    email: str = Field(..., min_length=5, max_length=200, description="Email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 chars)")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    """Public user profile (no password)."""
    id: str
    name: str
    email: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
