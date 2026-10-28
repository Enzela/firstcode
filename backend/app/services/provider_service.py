import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.provider import SMSProvider
from backend.app.models.message import SMSDeliveryAttempt

DEFAULT_PROVIDERS = [
    {
        "name": "ROUTE_A",
        "priority": 1,
        "balance": 500,
        "failure_rate": 0.30,  # 30% failure rate as specified in prompt
        "is_active": True
    },
    {
        "name": "ROUTE_B",
        "priority": 2,
        "balance": 500,
        "failure_rate": 0.15,  # 15% failure rate
        "is_active": True
    },
    {
        "name": "ROUTE_C",
        "priority": 3,
        "balance": 500,
        "failure_rate": 0.05,  # 5% failure rate (reliable backup)
        "is_active": True
    }
]

class ProviderService:
    @staticmethod
    def seed_default_providers(db: Session):
        """Seeds initial mock SMS routes if they don't exist."""
        for p_data in DEFAULT_PROVIDERS:
            existing = db.query(SMSProvider).filter(SMSProvider.name == p_data["name"]).first()
            if not existing:
                provider = SMSProvider(**p_data)
                db.add(provider)
        db.commit()

    @staticmethod
    def get_all_providers(db: Session) -> List[SMSProvider]:
        return db.query(SMSProvider).order_by(SMSProvider.priority.asc()).all()

    @staticmethod
    def get_provider_by_name(db: Session, name: str) -> Optional[SMSProvider]:
        return db.query(SMSProvider).filter(SMSProvider.name == name).first()

    @staticmethod
    def update_provider_config(
        db: Session,
        name: str,
        priority: Optional[int] = None,
        balance: Optional[int] = None,
        failure_rate: Optional[float] = None,
        is_active: Optional[bool] = None
    ) -> Optional[SMSProvider]:
        provider = db.query(SMSProvider).filter(SMSProvider.name == name).first()
        if not provider:
            return None
        if priority is not None:
            provider.priority = priority
        if balance is not None:
            provider.balance = balance
        if failure_rate is not None:
            provider.failure_rate = max(0.0, min(1.0, failure_rate))
        if is_active is not None:
            provider.is_active = is_active
        db.commit()
        db.refresh(provider)
        return provider

    @staticmethod
    def send_with_failover(
        db: Session,
        message_id: str,
        parts: int,
        force_fail_route: Optional[str] = None
    ) -> Tuple[bool, Optional[str], List[Dict[str, Any]]]:
        """
        Attempts sending through providers ordered by priority.
        If a provider fails or has insufficient balance, it falls over to the next priority provider.
        
        Returns:
            (success: bool, successful_route_name: Optional[str], attempt_logs: List[dict])
        """
        # Lock providers for balance deduction
        providers = db.query(SMSProvider).filter(
            SMSProvider.is_active == True
        ).order_by(SMSProvider.priority.asc()).all()

        attempt_logs = []
        attempt_num = 1

        for provider in providers:
            # Check provider balance
            if provider.getBalance() < parts:
                attempt = SMSDeliveryAttempt(
                    message_id=message_id,
                    provider_name=provider.name,
                    attempt_number=attempt_num,
                    status="FAILED",
                    error_reason=f"Insufficient provider balance ({provider.getBalance()} < {parts})"
                )
                db.add(attempt)
                attempt_logs.append({
                    "route": provider.name,
                    "attempt": attempt_num,
                    "status": "FAILED",
                    "reason": "Insufficient provider balance"
                })
                attempt_num += 1
                continue

            # Simulate network/gateway failure based on failure_rate
            is_simulated_failure = (force_fail_route == "ALL") or (force_fail_route == provider.name) or (random.random() < provider.failure_rate)

            if is_simulated_failure:
                attempt = SMSDeliveryAttempt(
                    message_id=message_id,
                    provider_name=provider.name,
                    attempt_number=attempt_num,
                    status="FAILED",
                    error_reason=f"Simulated route failure (rate: {provider.failure_rate * 100:.0f}%)"
                )
                db.add(attempt)
                attempt_logs.append({
                    "route": provider.name,
                    "attempt": attempt_num,
                    "status": "FAILED",
                    "reason": f"Provider connection error (failure rate: {provider.failure_rate * 100:.0f}%)"
                })
                attempt_num += 1
                continue  # Failover to next provider

            # Success! Deduct provider balance and record attempt
            provider.balance -= parts
            db.add(provider)

            attempt = SMSDeliveryAttempt(
                message_id=message_id,
                provider_name=provider.name,
                attempt_number=attempt_num,
                status="SUCCESS",
                error_reason=None
            )
            db.add(attempt)
            db.commit()

            attempt_logs.append({
                "route": provider.name,
                "attempt": attempt_num,
                "status": "SUCCESS",
                "reason": "Delivered successfully"
            })
            return True, provider.name, attempt_logs

        db.commit()
        # All providers failed or exhausted balance
        return False, None, attempt_logs

    @staticmethod
    def get_route_health(db: Session) -> List[Dict[str, Any]]:
        """
        Calculates health metrics for each SMS provider:
        Formula:
          Health % = (Empirical Success Rate [24h] * 0.6) + (Balance Availability * 0.3) + (Configured Reliability * 0.1)
        """
        now = datetime.now(timezone.utc)
        twenty_four_hours_ago = now - timedelta(hours=24)

        providers = db.query(SMSProvider).order_by(SMSProvider.priority.asc()).all()
        health_reports = []

        for p in providers:
            attempts_query = db.query(SMSDeliveryAttempt).filter(
                SMSDeliveryAttempt.provider_name == p.name,
                SMSDeliveryAttempt.created_at >= twenty_four_hours_ago
            )
            total_24h = attempts_query.count()
            success_24h = attempts_query.filter(SMSDeliveryAttempt.status == "SUCCESS").count()
            failed_24h = attempts_query.filter(SMSDeliveryAttempt.status == "FAILED").count()

            # Configured reliability
            configured_reliability = max(0.0, (1.0 - p.failure_rate) * 100.0)

            # Success rate over last 24h
            if total_24h > 0:
                success_rate_24h = (success_24h / total_24h) * 100.0
            else:
                success_rate_24h = configured_reliability  # Default baseline if no traffic yet

            # Balance availability factor (target 200+ balance for 100% capacity)
            balance_factor = min(p.balance / 200.0, 1.0) * 100.0 if p.balance > 0 else 0.0

            # Combined Health % Formula
            if total_24h > 0:
                health_score = (success_rate_24h * 0.6) + (balance_factor * 0.3) + (configured_reliability * 0.1)
            else:
                health_score = (configured_reliability * 0.7) + (balance_factor * 0.3)

            if not p.is_active:
                health_score = 0.0

            health_reports.append({
                "route_name": p.name,
                "priority": p.priority,
                "balance": p.getBalance(),
                "failure_rate": p.failure_rate,
                "failure_rate_percent": round(p.failure_rate * 100, 1),
                "is_active": p.is_active,
                "total_requests_24h": total_24h,
                "success_requests_24h": success_24h,
                "failed_requests_24h": failed_24h,
                "success_rate_24h": round(success_rate_24h, 1),
                "health_percentage": round(min(100.0, max(0.0, health_score)), 1)
            })

        return health_reports
