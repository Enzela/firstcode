from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User
from backend.app.schemas.route import RouteHealthResponse, RouteConfigUpdateRequest
from backend.app.services.provider_service import ProviderService

router = APIRouter()

@router.get("/health", response_model=List[RouteHealthResponse])
def get_routes_health(
    db: Session = Depends(get_db)
) -> Any:
    """
    Requirement 05: Route health monitoring.
    For each route: balance, success rate over the last 24h, and a health %.
    """
    return ProviderService.get_route_health(db)

@router.put("/{name}/config")
def update_route_configuration(
    name: str,
    payload: RouteConfigUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update route settings (priority, balance, simulated failure rate, active status).
    Useful for demonstration to intentionally trigger failover!
    """
    updated = ProviderService.update_provider_config(
        db=db,
        name=name.upper(),
        priority=payload.priority,
        balance=payload.balance,
        failure_rate=payload.failure_rate,
        is_active=payload.is_active
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{name}' not found"
        )
    return {
        "name": updated.name,
        "priority": updated.priority,
        "balance": updated.getBalance(),
        "failure_rate": updated.failure_rate,
        "is_active": updated.is_active,
        "message": f"Route {updated.name} updated successfully"
    }
