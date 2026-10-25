import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.entities import SecurityEvent
from app.schemas.schemas import SecurityEventItem
from app.core.rbac import (
    get_current_user, AuthenticatedUser, require_permission, Permission
)
from app.services.security_service import SecurityService

router = APIRouter(prefix="/security", tags=["Security Monitoring & Alerts"])

@router.get("/events", response_model=List[SecurityEventItem])
async def get_security_events(
    limit: int = 50,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.VIEW_SECURITY_EVENTS)),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(SecurityEvent)
        .where(
            (SecurityEvent.tenant_id == current_user.tenant_id) |
            (SecurityEvent.tenant_id == None)
        )
        .order_by(desc(SecurityEvent.created_at))
        .limit(limit)
    )
    res = await db.execute(query)
    events = res.scalars().all()
    
    output = []
    for e in events:
        try:
            meta = json.loads(e.metadata_json)
        except Exception:
            meta = {}
            
        output.append(SecurityEventItem(
            id=e.id,
            event_type=e.event_type,
            severity=e.severity,
            source=e.source,
            tenant_id=e.tenant_id,
            session_id=e.session_id,
            principal_id=e.principal_id,
            description=e.description,
            metadata=meta,
            created_at=e.created_at
        ))
    return output

@router.post("/simulate-egress-blocked")
async def simulate_egress_violation(
    session_id: str,
    target_host: str = "malicious-c2.external-domain.net",
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_SYSTEM)),
    db: AsyncSession = Depends(get_db)
):
    """Simulates an egress policy violation caught by container network firewall."""
    event = await SecurityService.log_security_event(
        db=db,
        event_type="EGRESS_CONNECTION_BLOCKED",
        severity="CRITICAL",
        source="CONTAINER_NETWORK_FILTER",
        tenant_id=current_user.tenant_id,
        session_id=session_id,
        principal_id=f"{session_id}-worker",
        description=f"Host network firewall intercepted and dropped outbound connection to non-allowlisted endpoint: '{target_host}:443'. Default-deny egress enforced.",
        metadata={"target_host": target_host, "port": 443, "protocol": "TCP", "action": "DROP"}
    )
    return {"success": True, "event_id": event.id, "alert": "EGRESS_CONNECTION_BLOCKED"}
