from datetime import datetime
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User
from backend.app.models.message import SMSMessage
from backend.app.schemas.sms import (
    SendSMSRequest,
    SendSMSResponse,
    EstimateSMSRequest,
    EstimateSMSResponse,
    PaginatedSMSLogsResponse,
    SMSLogItem
)
from backend.app.services.sms_service import SMSService
from backend.app.services.wallet_service import InsufficientCreditsError

router = APIRouter()

@router.post("/estimate", response_model=EstimateSMSResponse)
def estimate_sms_cost(
    payload: EstimateSMSRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Preview encoding, parts, valid/invalid numbers, and total credit cost before sending."""
    return SMSService.estimate_sms(payload.to, payload.message)

@router.post("/send", response_model=SendSMSResponse)
def send_sms(
    payload: SendSMSRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Core send endpoint matching Nest SMS requirement 03:
    - Normalizes & validates numbers (+977 / 977 -> 10 digits starting with 97/98)
    - Rejects invalid numbers clearly
    - Calculates parts per message (GSM-7: 160/153, Unicode: 70/67) and total cost
    - Rejects request if credits are not enough
    - Deducts credits in an atomic DB transaction with exclusive row lock
    - Routes to top-priority provider with balance, falling over to next on failure
    - Automatically refunds credits if message fails on all providers
    """
    try:
        result = SMSService.process_and_send(
            db=db,
            user=current_user,
            recipients=payload.to,
            message_text=payload.message,
            force_fail_route=payload.force_fail_route
        )
        return result
    except InsufficientCreditsError as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "INSUFFICIENT_CREDITS",
                "message": f"Insufficient credits: required {e.required}, available {e.current_balance}",
                "required_credits": e.required,
                "available_credits": e.current_balance
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/logs", response_model=PaginatedSMSLogsResponse)
def get_sms_logs(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: pending, sent, failed"),
    number: Optional[str] = Query(None, description="Filter by recipient phone number"),
    date_from: Optional[str] = Query(None, description="ISO format start date: YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="ISO format end date: YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Requirement 04: Paginated history, filterable by status (pending, sent, failed), date and number.
    """
    query = db.query(SMSMessage).filter(SMSMessage.user_id == current_user.id)

    if status_filter:
        query = query.filter(func.lower(SMSMessage.status) == status_filter.lower())

    if number:
        query = query.filter(SMSMessage.recipient.like(f"%{number.strip()}%"))

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(SMSMessage.created_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(SMSMessage.created_at <= dt_to)
        except ValueError:
            pass

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(SMSMessage.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
