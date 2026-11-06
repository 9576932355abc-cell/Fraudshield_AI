"""
app/ml/fraud_detector.py
─────────────────────────────────────────────
Purpose:
    Integration layer between the FraudShield backend and the XGBoost
    ML model deployed by the ML teammate.

    Architecture:
    ┌─────────────────┐    HTTP POST     ┌──────────────────────┐
    │  Backend        │ ───────────────► │  ML Model Server     │
    │  (this file)    │                  │  fraudshield-ai      │
    │                 │ ◄─────────────── │  on Render           │
    └─────────────────┘    JSON response └──────────────────────┘

    Request payload sent to ML model:
        {
            "sender_account": "ACC001",
            "receiver_account": "ACC002",
            "amount": 5000.00,
            "time": "2024-01-15T14:30:00"
        }

    Expected ML response:
        {
            "prediction": 1,
            "prediction_label": "Fraud",
            "fraud_probability": 99.95,       ← percentage (0-100)
            "rule_score": 50,                  ← integer score
            "triggered_rules": ["RULE001", "RULE002"],
            "reasons": ["High transaction amount", "Transaction during off-hours"],
            "risk_score": 84.97,               ← 0-100 scale
            "risk_level": "HIGH",
            "assistant": {
                "severity": "HIGH",
                "recommended_action": "BLOCK_TRANSACTION",
                "user_title": "Payment Stopped",
                "user_message": "Your payment has been temporarily paused.",
                "next_steps": ["Verify your identity."],
                "admin_summary": "...",
                "llm_used": true
            }
        }

    ── STUB MODE ────────────────────────────────────────────────────────────
    If the ML model server is not running (connection refused / timeout),
    `call_fraud_model` gracefully falls back to a LOCAL STUB that:
      - Returns anomaly_score = 0.10, risk_level = "LOW"  for amounts < 50,000
      - Returns anomaly_score = 0.75, risk_level = "MEDIUM" for 1L
      - Returns anomaly_score = 0.95, risk_level = "HIGH" for amounts > 1L

    This allows backend development and testing to proceed independently
    of the ML model availability.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional

import httpx

from app.config.settings import settings
from app.models.enums import RiskLevel

logger = logging.getLogger(__name__)


# ── ML Response Model ─────────────────────────────────────────────────────

@dataclass
class AssistantResponse:
    """User/admin-facing assistant block returned by the ML model."""
    severity: str = "LOW"
    recommended_action: str = "ALLOW_TRANSACTION"
    user_title: str = "Transaction Processed"
    user_message: str = "Your transaction was processed successfully."
    next_steps: List[str] = field(default_factory=list)
    admin_summary: str = ""
    llm_used: bool = False


@dataclass
class MLPrediction:
    """Structured response from the ML model."""
    # fraud_probability is stored as a percentage (0-100) from the ML API
    anomaly_score: float          # fraud_probability / 100  → 0-1 normalised for DB
    risk_level: RiskLevel
    prediction: int = 0           # 0 = Legitimate, 1 = Fraud
    prediction_label: str = "Legitimate"
    fraud_probability: float = 0.0   # raw % value from API (0-100)
    rule_score: int = 0              # integer rule score from API
    risk_score: float = 0.0          # raw % value from API (0-100)
    triggered_rules: List[str] = field(default_factory=list)
    reasons: List[str] = field(default_factory=list)
    assistant: Optional[AssistantResponse] = None


# ── Stub (Fallback) ───────────────────────────────────────────────────────

def _stub_prediction(amount: Decimal) -> MLPrediction:
    """
    Local rule-based fallback used when ML server is unreachable.
    Simulates the XGBoost model based on transaction amount thresholds.
    """
    amount_float = float(amount)

    if amount_float > 100_000:          # > ₹1 Lakh
        return MLPrediction(
            anomaly_score=0.95,
            risk_level=RiskLevel.HIGH,
            prediction=1,
            prediction_label="Fraud",
            fraud_probability=95.0,
            rule_score=60,
            risk_score=95.0,
            reasons=["Amount exceeds ₹1,00,000 threshold (stub fallback)"],
            assistant=AssistantResponse(
                severity="HIGH",
                recommended_action="BLOCK_TRANSACTION",
                user_title="Payment Stopped",
                user_message="Your payment has been temporarily paused for security verification.",
                next_steps=["Verify your identity.", "Contact support if this wasn't you."],
                admin_summary="Stub fallback: amount exceeds ₹1L threshold.",
                llm_used=False,
            ),
        )
    elif amount_float > 50_000:         # ₹50k – ₹1L
        return MLPrediction(
            anomaly_score=0.75,
            risk_level=RiskLevel.MEDIUM,
            prediction=1,
            prediction_label="Suspicious",
            fraud_probability=75.0,
            rule_score=40,
            risk_score=75.0,
            reasons=["Amount exceeds ₹50,000 threshold (stub fallback)"],
            assistant=AssistantResponse(
                severity="MEDIUM",
                recommended_action="REVIEW_TRANSACTION",
                user_title="Transaction Under Review",
                user_message="Your transaction is being reviewed for security purposes.",
                next_steps=["Wait for confirmation.", "Contact support if you have concerns."],
                admin_summary="Stub fallback: amount between ₹50k-₹1L threshold.",
                llm_used=False,
            ),
        )
    else:                               # < ₹50k
        return MLPrediction(
            anomaly_score=0.10,
            risk_level=RiskLevel.LOW,
            prediction=0,
            prediction_label="Legitimate",
            fraud_probability=10.0,
            rule_score=0,
            risk_score=10.0,
            assistant=AssistantResponse(
                severity="LOW",
                recommended_action="ALLOW_TRANSACTION",
                user_title="Transaction Successful",
                user_message="Your transaction was processed successfully.",
                next_steps=[],
                admin_summary="Stub fallback: low amount, low risk.",
                llm_used=False,
            ),
        )


# ── Real ML Call ──────────────────────────────────────────────────────────

async def call_fraud_model(
    amount: Decimal,
    sender_account_number: str,
    receiver_account_number: str,
    transaction_time: Optional[datetime] = None,
) -> MLPrediction:
    """
    Call the deployed ML model's /predict endpoint and return a structured prediction.

    Args:
        amount: Transaction amount.
        sender_account_number: Account number string of the sender.
        receiver_account_number: Account number string of the receiver.
        transaction_time: When the transaction occurred (defaults to now).

    Returns:
        MLPrediction with full ML fields: anomaly_score, risk_level,
        prediction, fraud_probability, rule_score, risk_score,
        triggered_rules, reasons.

    Behaviour:
        - On success: returns the ML model's prediction.
        - On any network/timeout error: logs a warning and returns stub prediction.
        - On unexpected ML response format: logs error and returns stub prediction.
    """
    if transaction_time is None:
        transaction_time = datetime.now(timezone(timedelta(hours=5, minutes=30))).replace(tzinfo=None)

    # Payload matching the deployed ML API schema
    # The ML API expects time as "HH:MM" (e.g. "10:10"), not a full ISO string
    payload = {
        "sender_account": sender_account_number,
        "receiver_account": receiver_account_number,
        "amount": float(amount),
        "time": transaction_time.strftime("%H:%M"),
    }

    try:
        async with httpx.AsyncClient(timeout=settings.ML_TIMEOUT_SECONDS) as client:
            response = await client.post(settings.ML_MODEL_URL, json=payload)
            response.raise_for_status()

            data = response.json()

            # ── Parse core fields ─────────────────────────────────────────
            prediction = int(data.get("prediction", 0))
            prediction_label = str(data.get("prediction_label", "Legitimate"))

            # fraud_probability & risk_score are now percentages (0-100)
            fraud_probability = float(data.get("fraud_probability", 0.0))
            rule_score = int(data.get("rule_score", 0))
            risk_score = float(data.get("risk_score", fraud_probability))
            triggered_rules: List[str] = list(data.get("triggered_rules", []))
            reasons: List[str] = list(data.get("reasons", []))

            # Map risk_level string → RiskLevel enum
            risk_level_str = str(data.get("risk_level", "LOW")).upper()
            try:
                risk_level = RiskLevel(risk_level_str)
            except ValueError:
                logger.error(
                    "ML model returned unknown risk_level '%s'. Defaulting to LOW.",
                    risk_level_str,
                )
                risk_level = RiskLevel.LOW

            # ── Parse nested assistant block ──────────────────────────────
            assistant_data = data.get("assistant") or {}
            assistant = AssistantResponse(
                severity=str(assistant_data.get("severity", risk_level_str)),
                recommended_action=str(assistant_data.get("recommended_action", "ALLOW_TRANSACTION")),
                user_title=str(assistant_data.get("user_title", "Transaction Processed")),
                user_message=str(assistant_data.get("user_message", "Your transaction was processed successfully.")),
                next_steps=list(assistant_data.get("next_steps", [])),
                admin_summary=str(assistant_data.get("admin_summary", "")),
                llm_used=bool(assistant_data.get("llm_used", False)),
            )

            logger.info("[ML MODEL RESPONSE] Successfully got prediction from Render ML API!")
            logger.info("   Payload: sender=%s, receiver=%s, amount=%s", sender_account_number, receiver_account_number, amount)
            logger.info(
                "   Result: prediction=%d (%s), fraud_probability=%.2f%%, risk_level=%s, recommended_action=%s",
                prediction, prediction_label, fraud_probability, risk_level.value, assistant.recommended_action,
            )

            logger.info(
                "ML prediction: prediction=%d (%s), fraud_probability=%.2f%%, "
                "risk_level=%s, risk_score=%.2f%%, rule_score=%d, triggered_rules=%s",
                prediction,
                prediction_label,
                fraud_probability,
                risk_level.value,
                risk_score,
                rule_score,
                triggered_rules,
            )

            # anomaly_score stored in DB is normalised 0-1 (divide percentage by 100)
            return MLPrediction(
                anomaly_score=fraud_probability / 100.0,
                risk_level=risk_level,
                prediction=prediction,
                prediction_label=prediction_label,
                fraud_probability=fraud_probability,
                rule_score=rule_score,
                risk_score=risk_score,
                triggered_rules=triggered_rules,
                reasons=reasons,
                assistant=assistant,
            )

    except httpx.ConnectError:
        logger.warning(
            "ML model server unreachable at %s. Using stub prediction.",
            settings.ML_MODEL_URL,
        )
    except httpx.TimeoutException:
        logger.warning(
            "ML model request timed out after %ds. Using stub prediction.",
            settings.ML_TIMEOUT_SECONDS,
        )
    except httpx.HTTPStatusError as exc:
        logger.error(
            "ML model returned HTTP %d. Using stub prediction. Response: %s",
            exc.response.status_code,
            exc.response.text,
        )
    except Exception as exc:
        logger.error("Unexpected ML model error: %s. Using stub prediction.", exc)

    # Graceful fallback
    stub_pred = _stub_prediction(amount)
    logger.warning("[STUB FALLBACK RESPONSE] ML Model server failed or unreachable. Using local stub rules.")
    logger.warning("   Stub Result: anomaly_score=%.2f, risk_level=%s", stub_pred.anomaly_score, stub_pred.risk_level.value)
    return stub_pred
