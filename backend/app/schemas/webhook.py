from typing import Optional
from pydantic import BaseModel, Field

class DeliveryReportWebhookRequest(BaseModel):
    message_id: str = Field(..., description="ID of the SMS message")
    status: str = Field(..., description="DELIVERED, UNDELIVERED, or FAILED")
    provider: str = Field(..., description="Reporting SMS Provider")
    delivery_time: Optional[str] = None
    error_code: Optional[str] = None

class DeliveryReportWebhookResponse(BaseModel):
    success: bool
    message: str
    message_id: str
    updated_status: str
