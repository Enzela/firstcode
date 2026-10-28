from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User
from backend.app.models.wallet import WalletLedger
from backend.app.schemas.wallet import WalletResponse, WalletTopUpRequest, WalletLedgerResponse
from backend.app.services.wallet_service import WalletService

router = APIRouter()

@router.get("/balance")
def get_wallet_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get the current user's wallet credit balance."""
    wallet = WalletService.get_or_create_wallet(db, current_user.id)
    return {
        "user_id": current_user.id,
        "balance": wallet.balance,
        "currency": "CREDITS",
        "updated_at": wallet.updated_at
    }

@router.post("/topup", response_model=WalletResponse)
def top_up_wallet(
    topup_in: WalletTopUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Top up wallet credits for testing or demonstration."""
    try:
        wallet = WalletService.top_up_credits(
            db=db,
            user_id=current_user.id,
            amount=topup_in.amount,
            description=topup_in.description or "Manual credit top-up"
        )
        return wallet
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/ledger", response_model=List[WalletLedgerResponse])
def get_wallet_ledger(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Returns immutable audit ledger of all balance changes (INITIAL, TOPUP, CHARGE, REFUND)."""
    entries = db.query(WalletLedger).filter(
        WalletLedger.user_id == current_user.id
    ).order_by(WalletLedger.created_at.desc()).limit(limit).all()
    return entries
