"""
main.py  (project root)
─────────────────────────────────────────────
Purpose:
    Uvicorn entry point. Run the server with:

        uvicorn main:app --reload           (development)
        uvicorn main:app --host 0.0.0.0     (production)

    This file simply imports the FastAPI application instance
    from app/main.py so that Uvicorn can discover it.
"""

from app.main import app  # noqa: F401  – re-exported for uvicorn

if __name__ == "__main__":
    import uvicorn
    from app.config.settings import settings

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
