from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, wallet, sms, routes, webhooks, demo

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["Wallet & Credits"])
api_router.include_router(sms.router, prefix="/sms", tags=["SMS Management"])
api_router.include_router(routes.router, prefix="/routes", tags=["Route Health & Failover"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Delivery Reports Webhook"])
api_router.include_router(demo.router, prefix="/demo", tags=["Interview Concurrency Demo"])

