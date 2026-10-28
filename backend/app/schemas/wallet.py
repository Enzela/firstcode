from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class WalletResponse(BaseModel):
    id: str
    user_id: str
    balance: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WalletTopUpRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Amount of credits to top up")
    description: Optional[str] = "Manual credit top-up"

class WalletLedgerResponse(BaseModel):
    id: str
    transaction_type: str
    amount: int
    balance_after: int
    reference_id: Optional[str]
    description: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
