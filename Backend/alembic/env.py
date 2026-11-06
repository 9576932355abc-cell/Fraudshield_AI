"""
alembic/env.py
─────────────────────────────────────────────
Purpose:
    Alembic migration environment configuration.
    - Reads DATABASE_URL from our app settings (not alembic.ini)
    - Imports all SQLModel table metadata for auto-detection
    - Supports both offline (SQL script) and online (live DB) migrations
"""

import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

# ── Make sure app/ is importable ──────────────────────────────────────────
# Add the project root (Backend/) to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Import all models so their tables are registered in SQLModel.metadata ─
# IMPORTANT: Every model must be imported here (directly or via __init__)
from app.models import (  # noqa: F401
    User, Account, Transaction, FraudRule, Alert, AuditLog,
)
from app.config.settings import settings  # noqa: F401

# ── Alembic Config ────────────────────────────────────────────────────────
config = context.config

# Set up logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override sqlalchemy.url with our DATABASE_URL from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Target SQLModel's metadata for auto-generation of migrations
target_metadata = SQLModel.metadata


# ── Offline Mode (generates SQL script without DB connection) ─────────────
def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    Outputs SQL to stdout instead of applying to a live database.
    Useful for reviewing or deploying to production without direct DB access.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ── Online Mode (applies migrations directly to the database) ─────────────
def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    Connects to the real database and applies pending migrations.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,         # detect column type changes
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ── Entry Point ───────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
