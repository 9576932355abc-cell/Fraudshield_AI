
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field

from app.models.enums import AccountType


class Account(SQLModel, table=True):

    __tablename__ = "accounts"

    account_id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="users.user_id", index=True)

    account_number: str = Field(unique=True, index=True)

    account_type: AccountType = Field(default=AccountType.SAVINGS)

    balance: Decimal = Field(default=Decimal("0.00"))