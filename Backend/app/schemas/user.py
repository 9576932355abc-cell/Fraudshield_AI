"""
app/schemas/user.py
─────────────────────────────────────────────
Purpose:
    Pydantic schemas for User API I/O.
    Separates what comes IN (request) from what goes OUT (response)
    so we never accidentally leak the password_hash.
"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.enums import UserRole


# ── Request Schemas ───────────────────────────────────────────────────────

class UserSignupRequest(BaseModel):
    """Body for POST /auth/signup"""
    full_name: str
    email: EmailStr
    phone_number: str
    password: str
    role: UserRole = UserRole.USER

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Accept 10-digit numbers, optionally starting with +91
        cleaned = re.sub(r"[\s\-()]", "", v)
        if not re.match(r"^(\+91)?[6-9]\d{9}$", cleaned):
            raise ValueError("Phone number must be a valid 10-digit Indian mobile number")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserLoginRequest(BaseModel):
    """Body for POST /auth/login"""
    email: EmailStr
    password: str


class UserUpdateRequest(BaseModel):
    """Body for PATCH /users/me — all fields optional"""
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Full name must be at least 2 characters")
        return v


# ── Response Schemas ──────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Safe user representation — never includes password_hash."""
    user_id: int
    full_name: str
    email: str
    phone_number: str
    role: UserRole
    is_active: bool
    created_at: datetime
    account_number: Optional[str] = None

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Admin: list of users with pagination info."""
    users: list[UserResponse]
    total: int
