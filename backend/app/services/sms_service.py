import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.user import User
from backend.app.models.message import SMSMessage
from backend.app.services.normalizer import (
    validate_and_normalize_recipients,
    normalize_and_validate_nepali_phone,
)
from backend.app.services.segmenter import calculate_sms_segments
from backend.app.services.wallet_service import WalletService, InsufficientCreditsError
from backend.app.services.provider_service import ProviderService

class SMSService:
    @staticmethod
    def estimate_sms(recipients: List[str], message: str) -> Dict[str, Any]:
        """Calculates segment info, valid/invalid numbers, parts, and total estimated cost."""
        segment_info = calculate_sms_segments(message)
        valid_numbers, invalid_numbers = validate_and_normalize_recipients(recipients)
        parts_per_recipient = segment_info["parts"]
        total_cost = parts_per_recipient * len(valid_numbers)

        return {
            "encoding": segment_info["encoding"],
            "character_count": segment_info["length"],
            "parts_per_message": parts_per_recipient,
            "valid_recipients": valid_numbers,
            "invalid_recipients": invalid_numbers,
            "total_valid": len(valid_numbers),
            "total_invalid": len(invalid_numbers),
            "cost_per_message": parts_per_recipient,
            "total_cost": total_cost,
        }

    @staticmethod
    def process_and_send(
        db: Session,
        user: User,
        recipients: List[str],
        message_text: str,
        force_fail_route: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates full SMS lifecycle:
        1. Normalization & validation. Rejects clearly if no valid recipients.
        2. Calculates parts and total cost.
        3. Atomically charges credits from user wallet.
        4. Tries highest priority provider with failover.
        5. Atomically refunds credits if every provider fails.
        """
        if not message_text or not message_text.strip():
            raise ValueError("Message content cannot be empty")

        # 1. Validate & Normalise recipients
        valid_numbers, invalid_numbers = validate_and_normalize_recipients(recipients)
        if not valid_numbers:
            raise ValueError(
                f"No valid Nepali mobile numbers provided. Invalid entries: {invalid_numbers}"
            )

        # 2. Calculate parts and cost
        segment_info = calculate_sms_segments(message_text)
        parts = segment_info["parts"]
        cost_per_sms = parts
        total_cost = cost_per_sms * len(valid_numbers)

        batch_id = str(uuid.uuid4())

        # 3. Atomic credit deduction inside DB transaction
        # Parallel requests cannot overspend because WalletService uses exclusive locking
        WalletService.deduct_credits(
            db=db,
            user_id=user.id,
            amount=total_cost,
            reference_id=batch_id,
            description=f"Send SMS batch {batch_id[:8]} ({len(valid_numbers)} recipients, {parts} parts)"
        )

        sent_messages = []
        failed_messages = []
        refunded_credits = 0

        # 4. Dispatch each valid recipient with failover
        for phone in valid_numbers:
            msg = SMSMessage(
                id=str(uuid.uuid4()),
                user_id=user.id,
                recipient=phone,
                original_recipient=phone,
                message=message_text,
                encoding=segment_info["encoding"],
                parts=parts,
                cost=cost_per_sms,
                status="PENDING",
                batch_id=batch_id,
                refunded=False
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            success, route_used, attempts = ProviderService.send_with_failover(
                db=db,
                message_id=msg.id,
                parts=parts,
                force_fail_route=force_fail_route
            )

            if success and route_used:
                msg.status = "SENT"
                msg.provider_name = route_used
                db.commit()
                sent_messages.append({
                    "id": msg.id,
                    "recipient": phone,
                    "status": "SENT",
                    "provider": route_used,
                    "attempts": attempts,
                    "parts": parts,
                    "cost": cost_per_sms,
                    "refunded": False
                })
            else:
                # 5. Delivery failed on every route -> Trigger automatic refund!
                msg.status = "FAILED"
                msg.refunded = True
                db.commit()

                WalletService.refund_credits(
                    db=db,
                    user_id=user.id,
                    amount=cost_per_sms,
                    reference_id=msg.id,
                    description=f"Auto-refund: failed routes for recipient {phone}"
                )
                refunded_credits += cost_per_sms

                failed_messages.append({
                    "id": msg.id,
                    "recipient": phone,
                    "status": "FAILED",
                    "provider": None,
                    "attempts": attempts,
                    "parts": parts,
                    "cost": cost_per_sms,
                    "refunded": True
                })

        final_balance = WalletService.get_balance(db, user.id)

        return {
            "batch_id": batch_id,
            "encoding": segment_info["encoding"],
            "parts_per_message": parts,
            "total_recipients": len(recipients),
            "valid_count": len(valid_numbers),
            "invalid_count": len(invalid_numbers),
            "sent_count": len(sent_messages),
            "failed_count": len(failed_messages),
            "total_charged": total_cost,
            "total_refunded": refunded_credits,
            "net_cost": total_cost - refunded_credits,
            "final_wallet_balance": final_balance,
            "sent_messages": sent_messages,
            "failed_messages": failed_messages,
            "invalid_recipients": invalid_numbers,
        }

