
from typing import Generator

from sqlmodel import Session, create_engine
from app.config.settings import settings


engine = create_engine(
    settings.DATABASE_URL,
    echo=False,              # never log raw SQL — use DB error logs only
    pool_pre_ping=True,      # verify connection health before use
    pool_size=10,            # max persistent connections
    max_overflow=20,         # extra connections beyond pool_size
)


# ── Session Dependency ────────────────────────────────────────────────────
def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a SQLModel Session.
    Automatically commits on success and rolls back on exception.
    Always closes the session when the request is done.
    """
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()