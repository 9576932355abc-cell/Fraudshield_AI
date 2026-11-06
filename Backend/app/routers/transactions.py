"""
app/routers/transactions.py
------------------------------------------------------------
Transaction APIs

User
-----
POST   /transactions/transfer
POST   /transactions/send-otp
POST   /transactions/verify-otp
GET    /transactions/

Admin
-----
GET    /admin/transactions
GET    /admin/transactions/high-risk
"""

from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
    status,
)

from sqlmodel import Session

from app.database import get_session
from app.core.dependencies import (
    get_current_user,
    require_admin,
)

from app.models.user import User

from app.schemas.transaction import (
    TransferRequest,
    TransactionListResponse,
)

from app.schemas.otp import (
    SendOTPRequest,
    VerifyOTPRequest,
)

from app.repositories import transaction_repo

from app.services import (
    transaction_service,
    account_service,
)

from app.services.otp_service import (
    generate_otp,
    create_otp_token,
    verify_otp,
)

from app.services.email_service import (
    send_email,
)

from app.utils.response import success_response

router = APIRouter(tags=["Transactions"])


# ==========================================================
# Transfer Money
# ==========================================================

@router.post(
    "/transactions/transfer",
    status_code=status.HTTP_201_CREATED,
    summary="Transfer Money",
)
async def transfer_money(
    body: TransferRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Initiate a transfer.

    If rapid-fire protection is triggered,
    backend returns otp_required=True.
    """

    result = await transaction_service.transfer_money(
        session=session,
        sender_user=current_user,
        data=body,
        otp_verified=False,
    )

    return success_response(
        data=result,
        message=result.get(
            "message",
            "Transfer processed.",
        ),
        status_code=status.HTTP_201_CREATED,
    )


# ==========================================================
# Send OTP
# ==========================================================

@router.post(
    "/transactions/send-otp",
    summary="Send OTP",
)
async def send_transfer_otp(
    body: SendOTPRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate OTP.

    Store it inside JWT.

    Send OTP to registered email.
    """

    otp = generate_otp()

    otp_token = create_otp_token(
        user=current_user,
        receiver_account_number=body.receiver_account_number,
        receiver_name=body.receiver_name,
        amount=body.amount,
        otp=otp,
    )

    send_email(
        current_user=current_user,
        otp=otp,
    )

    return success_response(
        data={
            "otp_token": otp_token,
        },
        message="OTP sent successfully.",
    )
# ==========================================================
# Verify OTP
# ==========================================================

@router.post(
    "/transactions/verify-otp",
    summary="Verify OTP and Complete Transaction",
)
async def verify_transaction_otp(
    body: VerifyOTPRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Verify OTP and complete the pending transaction.
    """

    try:
        payload = verify_otp(
            otp_token=body.otp_token,
            entered_otp=body.otp,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP.",
        )

    # ----------------------------------------------------
    # Security Check
    # ----------------------------------------------------

    if payload["user_id"] != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="OTP token does not belong to this user.",
        )

    # ----------------------------------------------------
    # Rebuild Transfer Request
    # ----------------------------------------------------

    transfer_request = TransferRequest(
        receiver_account_number=payload["receiver_account_number"],
        receiver_name=payload["receiver_name"],
        amount=payload["amount"],
    )

    # ----------------------------------------------------
    # Complete Transaction
    # ----------------------------------------------------

    result = await transaction_service.transfer_money(
        session=session,
        sender_user=current_user,
        data=transfer_request,
        otp_verified=True,
    )

    return success_response(
        data=result,
        message=result.get(
            "message",
            "Transaction completed successfully.",
        ),
        status_code=status.HTTP_200_OK,
    )


# ==========================================================
# My Transactions
# ==========================================================

@router.get(
    "/transactions/",
    response_model=TransactionListResponse,
    summary="My Transaction History",
)
def get_my_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):

    account = account_service.get_my_account(
        session,
        current_user.user_id,
    )

    transactions, total = transaction_service.get_my_transactions(
        session=session,
        account_id=account.account_id,
        skip=skip,
        limit=limit,
    )

    return TransactionListResponse(
        transactions=transactions,
        total=total,
    )
# ==========================================================
# Admin - All Transactions
# ==========================================================

@router.get(
    "/admin/transactions",
    response_model=TransactionListResponse,
    summary="[Admin] Get All Transactions",
)
def get_all_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """
    Returns all transactions in the system.

    Admin only.
    """

    transactions, total = transaction_service.get_all_transactions(
        session=session,
        skip=skip,
        limit=limit,
    )

    return TransactionListResponse(
        transactions=transactions,
        total=total,
    )


# ==========================================================
# Admin - High Risk Transactions
# ==========================================================

@router.get(
    "/admin/transactions/high-risk",
    response_model=TransactionListResponse,
    summary="[Admin] High Risk Transactions",
)
def get_high_risk_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """
    Returns only HIGH RISK transactions.

    Admin only.
    """

    transactions, total = transaction_repo.get_high_risk_transactions(
        session=session,
        skip=skip,
        limit=limit,
    )

    return TransactionListResponse(
        transactions=transactions,
        total=total,
    )