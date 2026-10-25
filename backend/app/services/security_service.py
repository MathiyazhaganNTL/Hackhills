import json
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.entities import SecurityEvent
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST

# Prometheus Metrics
INFERENCE_TOTAL = Counter("bayora_inference_requests_total", "Total inference requests processed", ["model", "status"])
SECURITY_EVENTS_TOTAL = Counter("bayora_security_events_total", "Total security alerts triggered", ["event_type", "severity"])
ACTIVE_SESSIONS_GAUGE = Gauge("bayora_active_sessions", "Number of currently active evaluation sessions")
AUDIT_RECORDS_GAUGE = Gauge("bayora_audit_records_count", "Total audit trail records verified")

class SecurityService:
    @staticmethod
    async def log_security_event(
        db: AsyncSession,
        event_type: str,
        severity: str,
        source: str,
        description: str,
        tenant_id: Optional[str] = None,
        session_id: Optional[str] = None,
        principal_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SecurityEvent:
        event = SecurityEvent(
            event_type=event_type,
            severity=severity,
            source=source,
            tenant_id=tenant_id,
            session_id=session_id,
            principal_id=principal_id,
            description=description,
            metadata_json=json.dumps(metadata or {})
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        
        # Increment Prometheus Metric
        SECURITY_EVENTS_TOTAL.labels(event_type=event_type, severity=severity).inc()
        return event

    @staticmethod
    async def get_recent_events(
        db: AsyncSession,
        tenant_id: Optional[str] = None,
        limit: int = 50
    ) -> List[SecurityEvent]:
        query = select(SecurityEvent).order_by(desc(SecurityEvent.created_at)).limit(limit)
        if tenant_id:
            query = query.where(SecurityEvent.tenant_id == tenant_id)
        res = await db.execute(query)
        return list(res.scalars().all())

    @staticmethod
    def get_prometheus_metrics() -> Tuple[bytes, str]:
        return generate_latest(), CONTENT_TYPE_LATEST
