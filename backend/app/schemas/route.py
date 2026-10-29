from typing import Optional
from pydantic import BaseModel, Field

class RouteHealthResponse(BaseModel):
    route_name: str
    priority: int
    balance: int
    failure_rate: float
    failure_rate_percent: float
    is_active: bool
    total_requests_24h: int
    success_requests_24h: int
    failed_requests_24h: int
    success_rate_24h: float
    health_percentage: float

class RouteConfigUpdateRequest(BaseModel):
    priority: Optional[int] = Field(None, ge=1)
    balance: Optional[int] = Field(None, ge=0)
    failure_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_active: Optional[bool] = None

