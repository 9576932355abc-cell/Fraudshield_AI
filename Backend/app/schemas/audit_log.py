"""
app/schemas/audit_log.py
─────────────────────────────────────────────
Purpose:
    Pydantic schemas for AuditLog API I/O.
"""

from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel

from app.models.enums import AuditActionType


# ── Response Schemas ──────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    log_id: int
    user_id: int
    action_type: AuditActionType
    action_details: str
    timestamp: datetime
    ip_address: Optional[str] = None

    # Enriched fields
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    details_parsed: Optional[Any] = None  # parsed JSON of action_details

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int
