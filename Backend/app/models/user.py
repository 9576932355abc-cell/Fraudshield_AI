
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field

from app.models.enums import UserRole


class User(SQLModel, table=True):

    __tablename__ = "users"

    user_id: Optional[int] = Field(default=None, primary_key=True)

    full_name: str = Field(index=True)

    email: str = Field(unique=True, index=True)

    phone_number: str = Field(unique=True, index=True)

    password_hash: str

    role: UserRole = Field(default=UserRole.USER)

    is_active: bool = Field(default=True)  

    created_at: datetime = Field(default_factory=datetime.utcnow)