
# ── Logging MUST be configured first — before any other imports ───────────
import logging
import logging.config

# Purge any handlers uvicorn may have already attached to the root logger
# before our app module was imported. Without this, we get duplicate lines
# in two different formats.
for _h in logging.root.handlers[:]:
    logging.root.removeHandler(_h)

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",          # default: only warnings+ from everything
    },
    "loggers": {
        # ── Your app loggers (always visible) ─────────────────────────────
        "fraudshield":            {"level": "INFO", "propagate": True},
        "app":                    {"level": "INFO", "propagate": True},

        # ── Third-party noise (silenced) ──────────────────────────────────
        "sqlalchemy":             {"level": "ERROR", "propagate": False},
        "sqlalchemy.engine":      {"level": "ERROR", "propagate": False},
        "sqlalchemy.pool":        {"level": "ERROR", "propagate": False},
        "httpx":                  {"level": "WARNING", "propagate": False},
        "httpcore":               {"level": "WARNING", "propagate": False},
        "uvicorn":                {"level": "WARNING", "propagate": False},
        "uvicorn.access":         {"level": "WARNING", "propagate": False},
        "uvicorn.error":          {"level": "WARNING", "propagate": False},
        "fastapi":                {"level": "WARNING", "propagate": False},
    },
})

# ── Now safe to import everything else ────────────────────────────────────
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel

from app.config.settings import settings
from app.database import engine
from app.middleware.logging_middleware import RequestLoggingMiddleware

# ── Import all models so SQLModel registers their metadata ────────────────
# This must happen before create_all is called
from app.models import (  # noqa: F401
    User, Account, Transaction, FraudRule, Alert, AuditLog,
)

# ── Import all routers ────────────────────────────────────────────────────
from app.routers import auth, users, accounts, transactions, fraud_rules, alerts, audit_logs

logger = logging.getLogger("fraudshield")


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Actions run on startup and shutdown.
    Using the modern `lifespan` pattern instead of deprecated @app.on_event.
    """
    # ── Startup ───────────────────────────────────────────────────────────
    logger.info(" FraudShield AI Backend starting up...")
    try:
        SQLModel.metadata.create_all(engine)
        logger.info(" Database tables verified/created")
    except Exception as db_err:
        logger.error(" Database connection failed: %s", db_err)
        logger.error(
            "👉 Check your DATABASE_URL in .env — "
            "get the correct string from Supabase Dashboard → Settings → Database"
        )
        # Do NOT re-raise — allow server to start so /docs and /health still work.
        # API endpoints will fail individually when DB is down.
    logger.info("📡 Server ready at http://localhost:8000")
    if settings.DEBUG:
        logger.info("📖 API docs available at http://localhost:8000/docs")
    else:
        logger.info("🔒 API documentation is disabled in production mode")

    yield  # Application runs here

    # ── Shutdown ──────────────────────────────────────────────────────────
    logger.info("🛑 FraudShield AI Backend shutting down...")


# ── FastAPI App Instance ──────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "## FraudShield AI – Banking Fraud Detection System\n\n"
        "A production-grade REST API for AI-powered banking fraud detection.\n\n"
        "### Features\n"
        "### Authentication\n"
        "Use `POST /auth/login` to get a JWT token, then click **Authorize** and "
        "enter `Bearer <your_token>` to test protected endpoints."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)


# ── CORS Middleware ───────────────────────────────────────────────────────
# Configured for the React.js frontend developed by the frontend teammate.
# Update origins list when the frontend is deployed to a real domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporary for testing
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time-Ms"],
)

# ── Request Logging Middleware ────────────────────────────────────────────
app.add_middleware(RequestLoggingMiddleware)


# ── Global Exception Handlers ─────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle Pydantic validation errors with a clean, frontend-friendly response
    instead of FastAPI's default verbose format.
    """
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({"field": field, "message": error["msg"]})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation failed. Please check your input.",
            "data": {"errors": errors},
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for unexpected server errors.
    Logs the full traceback without leaking internal details to the client.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred. Please try again later.",
            "data": None,
        },
    )


# ── Router Registration ───────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(fraud_rules.router)
app.include_router(alerts.router)
app.include_router(audit_logs.router)


# ── Health Check ──────────────────────────────────────────────────────────
@app.get(
    "/",
    tags=["Health"],
    summary="Health check",
    include_in_schema=True,
)
def root():
    """Basic health check endpoint. Returns server status."""
    return {
        "success": True,
        "message": f"{settings.APP_NAME} v{settings.APP_VERSION} is running",
        "docs": "/docs",
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="Detailed health check",
)
def health_check():
    """Detailed health check for monitoring systems."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }