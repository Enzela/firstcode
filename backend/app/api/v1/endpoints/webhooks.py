from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db
from backend.app.models.message import SMSMessage
from backend.app.schemas.webhook import DeliveryReportWebhookRequest, DeliveryReportWebhookResponse

router = APIRouter()

@router.post("/delivery-report", response_model=DeliveryReportWebhookResponse)
def handle_delivery_report(
    payload: DeliveryReportWebhookRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Bonus B3: Webhook endpoint that updates a message's status.
    Accepts carrier delivery receipts and updates the SMS record.
    """
    msg = db.query(SMSMessage).filter(SMSMessage.id == payload.message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with ID '{payload.message_id}' not found"
        )

    # Normalize incoming carrier status
    clean_status = payload.status.upper()
    valid_statuses = ["DELIVERED", "UNDELIVERED", "FAILED", "SENT"]
    if clean_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Must be one of {valid_statuses}"
        )

    msg.status = clean_status
    msg.updated_at = datetime.now(timezone.utc)
    db.commit()

    return DeliveryReportWebhookResponse(
        success=True,
        message=f"Message status successfully updated to {clean_status}",
        message_id=msg.id,
        updated_status=msg.status
    )

