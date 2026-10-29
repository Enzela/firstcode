import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class SMSMessage(Base):
    __tablename__ = "sms_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient = Column(String(20), nullable=False, index=True)
    original_recipient = Column(String(30), nullable=False)
    message = Column(Text, nullable=False)
    encoding = Column(String(10), nullable=False)  # GSM_7 or UNICODE
    parts = Column(Integer, nullable=False, default=1)
    cost = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default="PENDING", index=True)  # PENDING, SENT, FAILED, REFUNDED, DELIVERED
    provider_name = Column(String(50), nullable=True, index=True)
    batch_id = Column(String(36), nullable=True, index=True)
    refunded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="messages")
    attempts = relationship("SMSDeliveryAttempt", back_populates="message", cascade="all, delete-orphan")


class SMSDeliveryAttempt(Base):
    __tablename__ = "sms_delivery_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("sms_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_name = Column(String(50), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)  # SUCCESS, FAILED
    error_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    message = relationship("SMSMessage", back_populates="attempts")

