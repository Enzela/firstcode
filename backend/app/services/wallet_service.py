import threading
from typing import Optional, Dict
from sqlalchemy.orm import Session
from backend.app.models.wallet import Wallet, WalletLedger

class InsufficientCreditsError(Exception):
    def __init__(self, current_balance: int, required: int):
        self.current_balance = current_balance
        self.required = required
        super().__init__(f"Insufficient credits: required {required}, available {current_balance}")


# Per-user reentrant lock to ensure race-free concurrency even on SQLite/multi-threaded engines
_user_locks: Dict[str, threading.RLock] = {}
_lock_access = threading.Lock()

def get_user_lock(user_id: str) -> threading.RLock:
    with _lock_access:
        if user_id not in _user_locks:
            _user_locks[user_id] = threading.RLock()
        return _user_locks[user_id]


class WalletService:
    @staticmethod
    def get_or_create_wallet(db: Session, user_id: str, initial_balance: int = 50) -> Wallet:
        wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            wallet = Wallet(user_id=user_id, balance=initial_balance)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
            # Record initial grant ledger entry
            ledger = WalletLedger(
                wallet_id=wallet.id,
                user_id=user_id,
                transaction_type="INITIAL",
                amount=initial_balance,
                balance_after=initial_balance,
                description="Welcome credit grant"
            )
            db.add(ledger)
            db.commit()
        return wallet

    @staticmethod
    def get_balance(db: Session, user_id: str) -> int:
        wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        return wallet.balance if wallet else 0

    @staticmethod
    def deduct_credits(
        db: Session,
        user_id: str,
        amount: int,
        reference_id: Optional[str] = None,
        description: str = "SMS send charge"
    ) -> Wallet:
        """
        Atomically deducts credits from a user's wallet with exclusive row locking.
        Throws InsufficientCreditsError if balance < amount.
        """
        user_lock = get_user_lock(user_id)
        with user_lock:
            # Row-level locking for PostgreSQL / SQLite
            query = db.query(Wallet).filter(Wallet.user_id == user_id)
            if db.bind and db.bind.dialect.name == "postgresql":
                query = query.with_for_update()
            
            wallet = query.first()
            if not wallet:
                raise ValueError("Wallet not found for user")

            if wallet.balance < amount:
                raise InsufficientCreditsError(wallet.balance, amount)

            wallet.balance -= amount
            db.add(wallet)

            # Record immutable audit ledger entry
            ledger = WalletLedger(
                wallet_id=wallet.id,
                user_id=user_id,
                transaction_type="CHARGE",
                amount=amount,
                balance_after=wallet.balance,
                reference_id=reference_id,
                description=description
            )
            db.add(ledger)
            db.commit()
            db.refresh(wallet)
            return wallet

    @staticmethod
    def refund_credits(
        db: Session,
        user_id: str,
        amount: int,
        reference_id: Optional[str] = None,
        description: str = "Failed delivery refund"
    ) -> Wallet:
        """
        Atomically refunds credits to a user's wallet.
        """
        user_lock = get_user_lock(user_id)
        with user_lock:
            query = db.query(Wallet).filter(Wallet.user_id == user_id)
            if db.bind and db.bind.dialect.name == "postgresql":
                query = query.with_for_update()

            wallet = query.first()
            if not wallet:
                raise ValueError("Wallet not found for user")

            wallet.balance += amount
            db.add(wallet)

            ledger = WalletLedger(
                wallet_id=wallet.id,
                user_id=user_id,
                transaction_type="REFUND",
                amount=amount,
                balance_after=wallet.balance,
                reference_id=reference_id,
                description=description
            )
            db.add(ledger)
            db.commit()
            db.refresh(wallet)
            return wallet

    @staticmethod
    def top_up_credits(
        db: Session,
        user_id: str,
        amount: int,
        description: str = "Manual wallet top-up"
    ) -> Wallet:
        """
        Adds credits to a user's wallet.
        """
        if amount <= 0:
            raise ValueError("Top-up amount must be greater than 0")

        user_lock = get_user_lock(user_id)
        with user_lock:
            query = db.query(Wallet).filter(Wallet.user_id == user_id)
            if db.bind and db.bind.dialect.name == "postgresql":
                query = query.with_for_update()

            wallet = query.first()
            if not wallet:
                wallet = Wallet(user_id=user_id, balance=0)
                db.add(wallet)
                db.flush()

            wallet.balance += amount
            db.add(wallet)

            ledger = WalletLedger(
                wallet_id=wallet.id,
                user_id=user_id,
                transaction_type="TOPUP",
                amount=amount,
                balance_after=wallet.balance,
                description=description
            )
            db.add(ledger)
            db.commit()
            db.refresh(wallet)
            return wallet
