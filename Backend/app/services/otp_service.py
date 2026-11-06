"""
app/services/otp_service.py
---------------------------------------------------------
Stateless OTP Service

Features
---------
✓ Generate 6-digit OTP
✓ Encrypt OTP inside JWT
✓ No database storage
✓ Fetch phone number from current_user
✓ Ready for MSG91 / Twilio integration
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal

from jose import jwt
from app.services.email_service import send_email
from app.config.settings import settings
from app.models.user import User


# ==========================================================
# Generate OTP
# ==========================================================

def generate_otp() -> str:
    """Generate random 6 digit OTP"""
    return f"{random.randint(100000, 999999)}"


# ==========================================================
# Create OTP Token
# ==========================================================

def create_otp_token(
    *,
    user: User,
    receiver_account_number: str,
    receiver_name: str,
    amount: Decimal,
    otp: str,
) -> str:
    """
    Creates encrypted JWT containing

    • user id
    • receiver
    • amount
    • otp
    • expiry

    Nothing is stored in database.
    """

    expire = datetime.utcnow() + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )

    payload = {
        "user_id": user.user_id,
        "receiver_account_number": receiver_account_number,
        "receiver_name": receiver_name,
        "amount": str(amount),
        "otp": otp,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.OTP_SECRET_KEY,
        algorithm="HS256",
    )


# ==========================================================
# Decode OTP Token
# ==========================================================

def decode_otp_token(
    otp_token: str,
) -> dict:

    return jwt.decode(
        otp_token,
        settings.OTP_SECRET_KEY,
        algorithms=["HS256"],
    )


# ==========================================================
# Verify OTP
# ==========================================================

def verify_otp(
    otp_token: str,
    entered_otp: str,
) -> dict:
    """
    Returns decoded payload if OTP is correct.
    """

    payload = decode_otp_token(otp_token)

    if payload["otp"] != entered_otp:
        raise ValueError("Invalid OTP")

    return payload



 