from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class SendSMSRequest(BaseModel):
    to: List[str] = Field(..., min_length=1, description="List of recipient phone numbers (e.g. ['9841234567', '+9779801122334'])")
    message: str = Field(..., min_length=1, description="SMS text content")
    force_fail_route: Optional[str] = Field(None, description="Testing parameter to simulate complete failure of a specific route")

class EstimateSMSRequest(BaseModel):
    to: List[str] = Field(..., min_length=1)
    message: str = Field(..., min_length=1)

class EstimateSMSResponse(BaseModel):
    encoding: str
    character_count: int
    parts_per_message: int
    valid_recipients: List[str]
    invalid_recipients: List[Dict[str, str]]
    total_valid: int
    total_invalid: int
    cost_per_message: int
    total_cost: int

class DeliveryAttemptLog(BaseModel):
    route: str
    attempt: int
    status: str
    reason: Optional[str] = None

class SentMessageItem(BaseModel):
    id: str
    recipient: str
    status: str
    provider: Optional[str]
    attempts: List[Dict[str, Any]]
    parts: int
    cost: int
    refunded: bool

class SendSMSResponse(BaseModel):
    batch_id: str
    encoding: str
    parts_per_message: int
    total_recipients: int
    valid_count: int
    invalid_count: int
    sent_count: int
    failed_count: int
    total_charged: int
    total_refunded: int
    net_cost: int
    final_wallet_balance: int
    sent_messages: List[Dict[str, Any]]
    failed_messages: List[Dict[str, Any]]
    invalid_recipients: List[Dict[str, str]]

class SMSLogItem(BaseModel):
    id: str
    recipient: str
    original_recipient: str
    message: str
    encoding: str
    parts: int
    cost: int
    status: str
    provider_name: Optional[str]
    refunded: bool
    batch_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedSMSLogsResponse(BaseModel):
    items: List[SMSLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int
