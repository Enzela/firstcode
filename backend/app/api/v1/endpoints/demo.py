import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Any, List, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, get_current_user
from backend.app.core.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.wallet import Wallet
from backend.app.services.sms_service import SMSService
from backend.app.services.wallet_service import WalletService, InsufficientCreditsError

router = APIRouter()

def execute_single_send(user_id: str, index: int) -> Dict[str, Any]:
    """Worker function executed in separate DB session/thread."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        res = SMSService.process_and_send(
            db=db,
            user=user,
            recipients=["9841000001"],  # 1 valid recipient = 1 credit cost
            message_text=f"Concurrent Test #{index}"
        )
        return {
            "index": index,
            "status": "SUCCESS",
            "message": "Message accepted and processed",
            "batch_id": res["batch_id"]
        }
    except InsufficientCreditsError as e:
        return {
            "index": index,
            "status": "REJECTED_402",
            "message": f"Rejected: Insufficient credits (balance={e.current_balance})"
        }
    except Exception as e:
        return {
            "index": index,
            "status": "ERROR",
            "message": str(e)
        }
    finally:
        db.close()

@router.post("/run-concurrency-test")
async def run_concurrency_test(
    initial_credits: int = 10,
    parallel_requests: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Demonstrates the Core Challenge:
    'Watch for: fire 20 parallel send requests at a wallet that can only afford 10. Exactly 10 should succeed.'
    
    1. Resets user wallet balance to initial_credits (default: 10).
    2. Fires parallel_requests (default: 20) concurrent send requests.
    3. Exactly initial_credits requests succeed, remainder rejected with 402 Insufficient Balance.
    4. Wallet balance never goes negative and ends at exactly 0.
    """
    # 1. Reset user's wallet balance
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id, balance=initial_credits)
        db.add(wallet)
    else:
        wallet.balance = initial_credits
    db.commit()
    db.refresh(wallet)

    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=parallel_requests) as executor:
        tasks = [
            loop.run_in_executor(executor, execute_single_send, current_user.id, i + 1)
            for i in range(parallel_requests)
        ]
        results = await asyncio.gather(*tasks)

    # 3. Verify final balance and counts
    db.refresh(wallet)
    final_balance = wallet.balance

    success_count = sum(1 for r in results if r["status"] == "SUCCESS")
    rejected_count = sum(1 for r in results if r["status"] == "REJECTED_402")
    error_count = sum(1 for r in results if r["status"] == "ERROR")

    is_exact_pass = (success_count == initial_credits) and (rejected_count == parallel_requests - initial_credits) and (final_balance == 0)

    return {
        "scenario": f"Fired {parallel_requests} parallel send requests at a wallet with {initial_credits} credits",
        "initial_credits": initial_credits,
        "parallel_requests": parallel_requests,
        "success_count": success_count,
        "rejected_count": rejected_count,
        "error_count": error_count,
        "final_wallet_balance": final_balance,
        "test_passed": is_exact_pass,
        "verdict": "PERFECT: Exactly 10 succeeded, 10 rejected, zero double-spending!" if is_exact_pass else "MISMATCH",
        "requests": results
    }

