"""add_is_active_to_users

Revision ID: 975ad5536c6a
Revises: 
Create Date: 2026-06-26 11:25:28.415469

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '975ad5536c6a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # ── Create enum types (safe: skip if already exist) ───────────────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE accounttype AS ENUM ('SAVINGS', 'CURRENT');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE alerttype AS ENUM ('HIGH_RISK_TRANSACTION', 'SUSPICIOUS_PATTERN', 'RULE_VIOLATION');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE auditactiontype AS ENUM ('ADMIN_LOGIN', 'UPDATE_FRAUD_RULE', 'DELETE_FRAUD_RULE', 'CREATE_FRAUD_RULE', 'VIEW_ALERTS', 'BLOCK_USER', 'UNBLOCK_USER', 'VIEW_TRANSACTIONS', 'VIEW_AUDIT_LOGS');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE risklevel AS ENUM ('LOW', 'MEDIUM', 'HIGH');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transactionstatus AS ENUM ('SUCCESS', 'FLAGGED', 'BLOCKED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('USER', 'ADMIN');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)

    # ── accounts ──────────────────────────────────────────────────────────
    op.execute("ALTER TABLE accounts ALTER COLUMN account_type TYPE accounttype USING account_type::accounttype")
    op.create_index(op.f('ix_accounts_user_id'), 'accounts', ['user_id'], unique=False)

    # ── alerts ────────────────────────────────────────────────────────────
    op.add_column('alerts', sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'))
    op.execute("ALTER TABLE alerts ALTER COLUMN alert_type TYPE alerttype USING alert_type::alerttype")
    op.create_index(op.f('ix_alerts_alert_time'), 'alerts', ['alert_time'], unique=False)
    op.create_index(op.f('ix_alerts_transaction_id'), 'alerts', ['transaction_id'], unique=False)

    # ── audit_logs ────────────────────────────────────────────────────────
    op.add_column('audit_logs', sa.Column('ip_address', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.execute("ALTER TABLE audit_logs ALTER COLUMN action_type TYPE auditactiontype USING action_type::auditactiontype")
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

    # ── fraud_rules ───────────────────────────────────────────────────────
    op.add_column('fraud_rules', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('fraud_rules', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')))
    op.create_index(op.f('ix_fraud_rules_rule_name'), 'fraud_rules', ['rule_name'], unique=True)

    # ── transactions ──────────────────────────────────────────────────────
    op.alter_column('transactions', 'anomaly_score',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=True)
    op.execute("ALTER TABLE transactions ALTER COLUMN risk_level TYPE risklevel USING risk_level::risklevel")
    op.execute("ALTER TABLE transactions ALTER COLUMN status TYPE transactionstatus USING status::transactionstatus")
    op.create_index(op.f('ix_transactions_receiver_account_id'), 'transactions', ['receiver_account_id'], unique=False)
    op.create_index(op.f('ix_transactions_receiver_account_number'), 'transactions', ['receiver_account_number'], unique=False)
    op.create_index(op.f('ix_transactions_sender_account_id'), 'transactions', ['sender_account_id'], unique=False)
    op.create_index(op.f('ix_transactions_transaction_time'), 'transactions', ['transaction_time'], unique=False)

    # ── users ─────────────────────────────────────────────────────────────
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")
    op.create_index(op.f('ix_users_full_name'), 'users', ['full_name'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_full_name'), table_name='users')
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR USING role::VARCHAR")
    op.drop_column('users', 'is_active')
    op.drop_index(op.f('ix_transactions_transaction_time'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_sender_account_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_receiver_account_number'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_receiver_account_id'), table_name='transactions')
    op.execute("ALTER TABLE transactions ALTER COLUMN status TYPE VARCHAR USING status::VARCHAR")
    op.execute("ALTER TABLE transactions ALTER COLUMN risk_level TYPE VARCHAR USING risk_level::VARCHAR")
    op.alter_column('transactions', 'anomaly_score',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=False)
    op.drop_index(op.f('ix_fraud_rules_rule_name'), table_name='fraud_rules')
    op.drop_column('fraud_rules', 'created_at')
    op.drop_column('fraud_rules', 'is_active')
    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
    op.execute("ALTER TABLE audit_logs ALTER COLUMN action_type TYPE VARCHAR USING action_type::VARCHAR")
    op.drop_column('audit_logs', 'ip_address')
    op.drop_index(op.f('ix_alerts_transaction_id'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_alert_time'), table_name='alerts')
    op.execute("ALTER TABLE alerts ALTER COLUMN alert_type TYPE VARCHAR USING alert_type::VARCHAR")
    op.drop_column('alerts', 'is_resolved')
    op.drop_index(op.f('ix_accounts_user_id'), table_name='accounts')
    op.execute("ALTER TABLE accounts ALTER COLUMN account_type TYPE VARCHAR USING account_type::VARCHAR")
