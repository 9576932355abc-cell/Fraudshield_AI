"""
app/utils/response.py
─────────────────────────────────────────────
Purpose:
    Standard API response wrapper so every endpoint returns
    a consistent JSON structure:

    {
        "success": true,
        "message": "...",
        "data": { ... }
    }

    Use `success_response()` in routers instead of returning raw dicts.
"""

from typing import Any, Optional
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200,
) -> JSONResponse:
    """
    Wrap any payload in a standard success envelope.

    Args:
        data: The payload to return (dict, list, None, etc.)
        message: Human-readable success message.
        status_code: HTTP status code (default 200).

    Returns:
        JSONResponse with consistent structure.
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
        },
    )


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    details: Optional[Any] = None,
) -> JSONResponse:
    """
    Wrap error information in a standard error envelope.
    Normally FastAPI exception handlers produce these automatically,
    but this is useful for edge cases.
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": details,
        },
    )
