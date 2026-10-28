import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    balance = Column(Integer, nullable=False, default=50)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("balance >= 0", name="check_positive_balance"),
    )

    user = relationship("User", back_populates="wallet")
    ledger_entries = relationship("WalletLedger", back_populates="wallet", cascade="all, delete-orphan")


class WalletLedger(Base):
    __tablename__ = "wallet_ledgers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String(36), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(32), nullable=False)  # INITIAL, TOPUP, CHARGE, REFUND
    amount = Column(Integer, nullable=False)               # Cost charged (positive) or refunded
    balance_after = Column(Integer, nullable=False)        # Audit trail of resulting balance
    reference_id = Column(String(64), nullable=True, index=True)  # Batch ID or Message ID
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    wallet = relationship("Wallet", back_populates="ledger_entries")
    user = relationship("User", back_populates="ledger_entries")
