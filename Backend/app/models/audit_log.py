
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field

from app.models.enums import AuditActionType


class AuditLog(SQLModel, table=True):

    __tablename__ = "audit_logs"

    log_id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="users.user_id", index=True)

    action_type: AuditActionType

    action_details: str  # Store as JSON string for flexibility

    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)

    ip_address: Optional[str] = Field(default=None)