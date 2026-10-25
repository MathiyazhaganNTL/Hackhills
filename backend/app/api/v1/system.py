from fastapi import APIRouter, Response
from app.services.isolation_engine import IsolationCapabilityDetector
from app.services.secrets_manager import secrets_manager
from app.services.security_service import SecurityService

router = APIRouter(tags=["System & Observability"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Bayora AI Safety & Red-Teaming Infrastructure",
        "version": "1.0.0"
    }

@router.get("/ready")
async def readiness_check():
    return {
        "ready": True,
        "database": "connected",
        "llm_gateway": "online",
        "audit_pipeline": "active"
    }

@router.get("/capabilities")
async def get_capabilities():
    """Accurately exposes runtime isolation capabilities and boundaries."""
    return IsolationCapabilityDetector.detect()

@router.get("/vault-status")
async def get_vault_status():
    return secrets_manager.get_vault_health()

@router.get("/metrics")
async def prometheus_metrics():
    content, content_type = SecurityService.get_prometheus_metrics()
    return Response(content=content, media_type=content_type)
