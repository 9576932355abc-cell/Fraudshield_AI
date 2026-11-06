from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Session

from app.ml.fraud_detector import call_fraud_model
from app.models.enums import RiskLevel, TransactionStatus
from app.models.transaction import Transaction
from app.models.user import User

from app.repositories import (
    account_repo,
    transaction_repo,
    user_repo,
)

from app.schemas.transaction import TransferRequest
from app.services import alert_service

from app.utils.exceptions import (
    AccountNotFoundError,
    SelfTransferError,
    ReceiverNameMismatchError,
    InsufficientBalanceError,
)


# ─────────────────────────────────────────────────────────────────
# Thresholds
# ─────────────────────────────────────────────────────────────────
HIGH_VALUE_THRESHOLD = Decimal("100000")  # ₹1,00,000 (1 lakh)
OTP_FREQUENCY_LIMIT   = 2                 # max transactions in window
OTP_WINDOW_SECONDS    = 120               # 2-minute rolling window


async def transfer_money(
    session: Session,
    sender_user: User,
    data: TransferRequest,
    otp_verified: bool = False,
) -> dict:
    """
    Executes a money transfer with three layers of OTP protection:

      1. Rapid-fire (rate-limit): more than OTP_FREQUENCY_LIMIT transactions
         in OTP_WINDOW_SECONDS → otp_required, reason=RAPID_FIRE

      2. High-value: amount ≥ HIGH_VALUE_THRESHOLD (₹50,000) → otp_required,
         reason=HIGH_VALUE

      3. ML fraud detection: ML model returns HIGH risk level → otp_required,
         reason=FRAUD  (includes full fraud details: reasons, triggered_rules,
         risk_level, assistant message)

    When called with otp_verified=True (from verify-otp route):
      • Skips all three pre-checks.
      • Creates the transaction as SUCCESS.
      • Stores ML risk scores for audit but does NOT generate a fraud alert
        (the user has already verified their identity via OTP).

    If the user closes the modal without completing OTP verification:
      • No transaction is ever written to the database.
      • The attempted transfer is simply abandoned.
    """

    # ── 1. Sender account ─────────────────────────────────────────
    sender_account = account_repo.get_account_by_user_id(
        session,
        sender_user.user_id,
    )
    if sender_account is None:
        raise AccountNotFoundError("Sender account not found")

    # ── 2. Receiver account ───────────────────────────────────────
    receiver_account = account_repo.get_account_by_number(
        session,
        data.receiver_account_number,
    )
    if receiver_account is None:
        raise AccountNotFoundError(data.receiver_account_number)

    # ── 3. Self-transfer guard ────────────────────────────────────
    if sender_account.account_id == receiver_account.account_id:
        raise SelfTransferError()

    # ── 4. Receiver name verification ────────────────────────────
    receiver_user = user_repo.get_user_by_id(
        session,
        receiver_account.user_id,
    )
    if receiver_user is None:
        raise AccountNotFoundError(data.receiver_account_number)

    if (
        receiver_user.full_name.strip().lower()
        !=
        data.receiver_name.strip().lower()
    ):
        raise ReceiverNameMismatchError()

    # ── 5. Balance check ──────────────────────────────────────────
    if sender_account.balance < data.amount:
        raise InsufficientBalanceError(
            balance=float(sender_account.balance),
            amount=float(data.amount),
        )

    # ── 6. OTP gates (skipped when otp_verified=True) ─────────────
    if not otp_verified:

        # ─ Gate A: Rapid-fire / frequency check ──────────────────
        recent_count = transaction_repo.count_recent_sender_transactions(
            session=session,
            sender_account_id=sender_account.account_id,
            within_seconds=OTP_WINDOW_SECONDS,
        )

        if recent_count >= OTP_FREQUENCY_LIMIT:
            return {
                "success": False,
                "otp_required": True,
                "otp_reason": "RAPID_FIRE",
                "message": (
                    f"Too many transactions in {OTP_WINDOW_SECONDS // 60} minutes. "
                    "OTP verification required to continue."
                ),
                "receiver_account_number": data.receiver_account_number,
                "receiver_name":           data.receiver_name,
                "amount":                  str(data.amount),
            }

        # ─ Gate B: High-value threshold check ────────────────────
        if data.amount >= HIGH_VALUE_THRESHOLD:
            # Call ML model to get an LLM-generated assistant message
            hv_check = await call_fraud_model(
                amount=data.amount,
                sender_account_number=sender_account.account_number,
                receiver_account_number=receiver_account.account_number,
                transaction_time=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            hv_assistant = None
            if hv_check.assistant:
                a = hv_check.assistant
                hv_assistant = {
                    "severity":           a.severity,
                    "recommended_action": a.recommended_action,
                    "user_title":         a.user_title,
                    "user_message":       a.user_message,
                    "next_steps":         a.next_steps,
                    "admin_summary":      a.admin_summary,
                    "llm_used":           a.llm_used,
                }
            return {
                "success": False,
                "otp_required": True,
                "otp_reason": "HIGH_VALUE",
                "message": (
                    "Transactions above ₹1,00,000 require OTP verification."
                ),
                "receiver_account_number": data.receiver_account_number,
                "receiver_name":           data.receiver_name,
                "amount":                  str(data.amount),
                "risk_level":              "MEDIUM",
                "reasons":                 [f"Transaction amount ₹{float(data.amount):,.2f} exceeds the high-value threshold of ₹1,00,000."],
                "triggered_rules":         hv_check.triggered_rules or [],
                "fraud_probability":       hv_check.fraud_probability,
                "assistant":               hv_assistant,
            }

        # ─ Gate C: ML fraud pre-scan ─────────────────────────────
        pre_check = await call_fraud_model(
            amount=data.amount,
            sender_account_number=sender_account.account_number,
            receiver_account_number=receiver_account.account_number,
            transaction_time=datetime.now(timezone.utc).replace(tzinfo=None),
        )

        if pre_check.risk_level == RiskLevel.HIGH:
            assistant_data = None
            if pre_check.assistant:
                a = pre_check.assistant
                assistant_data = {
                    "severity":            a.severity,
                    "recommended_action":  a.recommended_action,
                    "user_title":          a.user_title,
                    "user_message":        a.user_message,
                    "next_steps":          a.next_steps,
                    "admin_summary":       a.admin_summary,
                    "llm_used":            a.llm_used,
                }

            return {
                "success":                 False,
                "otp_required":            True,
                "otp_reason":              "FRAUD",
                "message":                 "Suspicious transaction detected by FraudShield AI.",
                "receiver_account_number": data.receiver_account_number,
                "receiver_name":           data.receiver_name,
                "amount":                  str(data.amount),
                "risk_level":              pre_check.risk_level.value,
                "fraud_probability":       pre_check.fraud_probability,
                "risk_score":              pre_check.risk_score,
                "rule_score":              pre_check.rule_score,
                "reasons":                 pre_check.reasons,
                "triggered_rules":         pre_check.triggered_rules,
                "assistant":               assistant_data,
            }

    # ── 7. Execute the transfer ───────────────────────────────────
    sender_account.balance = (
        Decimal(str(sender_account.balance)) - data.amount
    )
    receiver_account.balance = (
        Decimal(str(receiver_account.balance)) + data.amount
    )

    account_repo.update_account(session, sender_account)
    account_repo.update_account(session, receiver_account)

    transaction = Transaction(
        sender_account_id=sender_account.account_id,
        receiver_account_id=receiver_account.account_id,
        receiver_account_number=data.receiver_account_number,
        receiver_name=data.receiver_name,
        amount=data.amount,
        status=TransactionStatus.SUCCESS,
    )
    transaction = transaction_repo.create_transaction(session, transaction)

    # ── 8. Post-creation ML risk scoring (for audit / record) ────
    ml_result = await call_fraud_model(
        amount=data.amount,
        sender_account_number=sender_account.account_number,
        receiver_account_number=receiver_account.account_number,
        transaction_time=transaction.transaction_time,
    )

    transaction.anomaly_score = ml_result.anomaly_score
    transaction.risk_level    = ml_result.risk_level

    alert_created = False

    # Only generate a fraud alert if:
    #   • ML says HIGH risk  AND
    #   • the user did NOT verify with OTP
    # (If otp_verified=True the user consciously proceeded after seeing the warning.)
    if ml_result.risk_level == RiskLevel.HIGH and not otp_verified:
        transaction.status = TransactionStatus.FLAGGED
        alert_service.create_fraud_alert(session, transaction)
        alert_created = True

    transaction_repo.update_transaction(session, transaction)

    # ── 9. Build assistant block for response ─────────────────────
    assistant_response = None
    if ml_result.assistant:
        a = ml_result.assistant
        assistant_response = {
            "severity":           a.severity,
            "recommended_action": a.recommended_action,
            "user_title":         a.user_title,
            "user_message":       a.user_message,
            "next_steps":         a.next_steps,
            "admin_summary":      a.admin_summary,
            "llm_used":           a.llm_used,
        }

    return {
        "success":                 True,
        "otp_required":            False,
        "transaction_id":          transaction.transaction_id,
        "sender_account_number":   sender_account.account_number,
        "receiver_account_number": receiver_account.account_number,
        "receiver_name":           receiver_user.full_name,
        "amount":                  str(transaction.amount),
        "transaction_time":        transaction.transaction_time.isoformat(),
        "status":                  transaction.status.value,
        "risk_level":              ml_result.risk_level.value,
        "fraud_probability":       ml_result.fraud_probability,
        "risk_score":              ml_result.risk_score,
        "rule_score":              ml_result.rule_score,
        "prediction":              ml_result.prediction,
        "prediction_label":        ml_result.prediction_label,
        "anomaly_score":           ml_result.anomaly_score,
        "triggered_rules":         ml_result.triggered_rules,
        "reasons":                 ml_result.reasons,
        "alert_generated":         alert_created,
        "otp_verified":            otp_verified,
        "assistant":               assistant_response,
        "message": (
            "Transaction completed successfully."
            if not alert_created
            else "Transaction blocked by FraudShield AI."
        ),
    }


# ── Fetch Current User Transactions ──────────────────────────────────────

def get_my_transactions(
    session: Session,
    account_id: int,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Transaction], int]:
    """
    Returns the authenticated user's transaction history.
    Includes both sent and received transactions.
    """
    return transaction_repo.get_transactions_by_account(
        session=session,
        account_id=account_id,
        skip=skip,
        limit=limit,
    )


# ── Admin - Fetch All Transactions ────────────────────────────────────────

def get_all_transactions(
    session: Session,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Transaction], int]:
    """
    Returns every transaction in the system.
    Accessible only by ADMIN users.
    """
    return transaction_repo.get_all_transactions(
        session=session,
        skip=skip,
        limit=limit,
    )