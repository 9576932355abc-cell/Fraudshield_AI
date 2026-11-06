from decimal import Decimal

from pydantic import BaseModel, field_validator


class SendOTPRequest(BaseModel):

    receiver_account_number: str
    receiver_name: str
    amount: Decimal


class VerifyOTPRequest(BaseModel):

    otp: str
    otp_token: str