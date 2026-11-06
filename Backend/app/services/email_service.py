import requests

from app.config.settings import settings
from app.models.user import User


def send_email(current_user: User, otp: str):
    # Always print OTP to stdout for local development
    print("=" * 50)
    print(f"OTP FOR {current_user.email}: {otp}")
    print("=" * 50)

    if not settings.BREVO_API_KEY:
        print("BREVO_API_KEY is missing.")
        return False

    if not settings.BREVO_FROM_EMAIL:
        print("BREVO_FROM_EMAIL is missing.")
        return False

    subject = "FraudShield AI - Transaction OTP"

    body = f"""
    <h2>FraudShield AI</h2>

    <p>Dear {current_user.full_name},</p>

    <p>Your OTP is:</p>

    <h1>{otp}</h1>

    <p>This OTP is valid for <b>5 minutes</b>.</p>

    <p>Please do not share this OTP with anyone.</p>

    <br>

    <p>Regards,<br>FraudShield AI</p>
    """

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
            },
            json={
                "sender": {
                    "name": "FraudShield AI",
                    "email": settings.BREVO_FROM_EMAIL,
                },
                "to": [
                    {
                        "email": current_user.email,
                        "name": current_user.full_name,
                    }
                ],
                "subject": subject,
                "htmlContent": body,
            },
            timeout=15,
        )

        print("Status Code:", response.status_code)
        print("Response:", response.text)

        if response.status_code in (200, 201):
            print(f"OTP email successfully sent to {current_user.email} via Brevo")
            return True
        else:
            print(f"Failed to send email via Brevo: HTTP {response.status_code}")
            return False

    except Exception as exc:
        print(f"Error calling Brevo API: {exc}")
        return False