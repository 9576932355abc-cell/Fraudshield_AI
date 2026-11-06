

from enum import Enum


class UserRole(str, Enum):
    """Roles available in the system."""
    USER = "USER"
    ADMIN = "ADMIN"


class AccountType(str, Enum):
    """Types of bank accounts."""
    SAVINGS = "SAVINGS"
    CURRENT = "CURRENT"


class RiskLevel(str, Enum):
    """ML model risk classification."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TransactionStatus(str, Enum):
    """Lifecycle status of a transaction."""
    SUCCESS = "SUCCESS"
    FLAGGED = "FLAGGED"      # HIGH risk but not blocked
    BLOCKED = "BLOCKED"      # Blocked due to fraud rule


class AlertType(str, Enum):
    """Category of fraud alert."""
    HIGH_RISK_TRANSACTION = "HIGH_RISK_TRANSACTION"
    SUSPICIOUS_PATTERN = "SUSPICIOUS_PATTERN"
    RULE_VIOLATION = "RULE_VIOLATION"


class AuditActionType(str, Enum):
    """Actions recorded in the audit log."""
    ADMIN_LOGIN = "ADMIN_LOGIN"
    UPDATE_FRAUD_RULE = "UPDATE_FRAUD_RULE"
    DELETE_FRAUD_RULE = "DELETE_FRAUD_RULE"
    CREATE_FRAUD_RULE = "CREATE_FRAUD_RULE"
    VIEW_ALERTS = "VIEW_ALERTS"
    BLOCK_USER = "BLOCK_USER"
    UNBLOCK_USER = "UNBLOCK_USER"
    VIEW_TRANSACTIONS = "VIEW_TRANSACTIONS"
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"
