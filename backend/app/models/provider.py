import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from backend.app.core.database import Base

class SMSProvider(Base):
    __tablename__ = "sms_providers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, index=True, nullable=False)
    priority = Column(Integer, nullable=False)  # 1 is highest priority
    balance = Column(Integer, nullable=False, default=1000)
    failure_rate = Column(Float, nullable=False, default=0.0)  # e.g. 0.30 for 30%
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def getBalance(self) -> int:
        """Returns the current credit balance available for this provider."""
        return self.balance
