"""
routes/auth_routes.py — Authentication Endpoints
Signup, Login, and profile retrieval.
"""

from fastapi import APIRouter, HTTPException, Request
from models.user import UserSignup, UserLogin, UserResponse, TokenResponse
from auth import hash_password, verify_password, create_token, get_current_user
from database import users_collection

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(data: UserSignup):
    """Register a new user."""
    # Check if email already exists
    existing = users_collection.find_one({"email": data.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user document
    user_doc = {
        "name": data.name.strip(),
        "email": data.email.lower().strip(),
        "password": hash_password(data.password),
    }
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate token
    token = create_token(user_id, user_doc["email"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, name=user_doc["name"], email=user_doc["email"]),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Authenticate user and return JWT token."""
    user = users_collection.find_one({"email": data.email.lower().strip()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_token(user_id, user["email"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, name=user["name"], email=user["email"]),
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(request: Request):
    """Get current user's profile (requires auth token)."""
    payload = get_current_user(request)
    user = users_collection.find_one({"email": payload["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=str(user["_id"]), name=user["name"], email=user["email"])
