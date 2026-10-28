from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.rate_limit import limiter
from backend.app.api.v1.api import api_router
from backend.app.api.v1.endpoints import sms, routes
from backend.app.services.provider_service import ProviderService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed default mock providers
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ProviderService.seed_default_providers(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Mini SMS Gateway REST API for Nest Nepal Backend Developer Take-Home Task",
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# SlowAPI Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root status
@app.get("/", tags=["System"])
def root_status():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

# Main API router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Direct aliases matching assignment specs:
# POST /sms/send, GET /sms/logs, GET /routes/health
app.include_router(sms.router, prefix="/sms", tags=["SMS Direct Routes"])
app.include_router(routes.router, prefix="/routes", tags=["Routes Direct Routes"])
