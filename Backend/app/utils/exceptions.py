"""
app/utils/exceptions.py
─────────────────────────────────────────────
Purpose:
    Custom HTTP exceptions for clean, consistent error responses
    throughout the application. Import and raise these instead of
    raw HTTPException to standardise error messages.
"""

from fastapi import HTTPException, status


# ── 400 Bad Request ───────────────────────────────────────────────────────
class BadRequestError(HTTPException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


# ── 401 Unauthorized ──────────────────────────────────────────────────────
class UnauthorizedError(HTTPException):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── 403 Forbidden ─────────────────────────────────────────────────────────
class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


# ── 404 Not Found ─────────────────────────────────────────────────────────
class NotFoundError(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


# ── 409 Conflict ──────────────────────────────────────────────────────────
class ConflictError(HTTPException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


# ── 422 Unprocessable Entity ──────────────────────────────────────────────
class UnprocessableError(HTTPException):
    def __init__(self, detail: str = "Unprocessable entity"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail
        )


# ── 503 Service Unavailable ───────────────────────────────────────────────
class ServiceUnavailableError(HTTPException):
    def __init__(self, detail: str = "External service is unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail
        )


# ── Domain-specific shortcuts ─────────────────────────────────────────────
class InvalidCredentialsError(UnauthorizedError):
    def __init__(self):
        super().__init__(detail="Invalid email or password")


class TokenExpiredError(UnauthorizedError):
    def __init__(self):
        super().__init__(detail="Access token has expired")


class InsufficientBalanceError(BadRequestError):
    def __init__(self, balance: float, amount: float):
        super().__init__(
            detail=f"Insufficient balance. Available: {balance:.2f}, Required: {amount:.2f}"
        )


class AccountNotFoundError(NotFoundError):
    def __init__(self, identifier: str = ""):
        detail = f"Account not found: {identifier}" if identifier else "Account not found"
        super().__init__(detail=detail)


class UserNotFoundError(NotFoundError):
    def __init__(self, identifier: str = ""):
        detail = f"User not found: {identifier}" if identifier else "User not found"
        super().__init__(detail=detail)


class UserAlreadyExistsError(ConflictError):
    def __init__(self, field: str = "email"):
        super().__init__(detail=f"A user with this {field} already exists")


class SelfTransferError(BadRequestError):
    def __init__(self):
        super().__init__(detail="You cannot transfer money to your own account")


class ReceiverNameMismatchError(BadRequestError):
    def __init__(self):
        super().__init__(detail="Receiver name does not match the account holder")


class UserBlockedError(ForbiddenError):
    def __init__(self):
        super().__init__(detail="Your account has been blocked. Contact support.")


class RapidFireFraudError(HTTPException):
    """
    Raised when a sender makes more than the allowed number of transactions
    within a short time window. Transaction is BLOCKED immediately without
    calling the ML model.
    """
    def __init__(self, count: int, window_seconds: int = 60, limit: int = 3):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Transaction BLOCKED: Rapid-fire fraud detected. "
                f"You have made {count} transactions in the last {window_seconds} seconds "
                f"(limit is {limit}). Please wait before trying again."
            ),
        )
