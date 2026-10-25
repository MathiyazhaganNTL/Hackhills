from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.entities import AuditRecord
from app.schemas.schemas import AuditRecordItem, AuditVerifyReport
from app.core.rbac import (
    get_current_user, AuthenticatedUser, require_permission, Permission
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Trail"])

@router.get("/records", response_model=List[AuditRecordItem])
async def get_audit_records(
    limit: int = 50,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.VIEW_AUDIT_LOGS)),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(AuditRecord)
        .order_by(desc(AuditRecord.sequence_number))
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()
    
    return [
        AuditRecordItem(
            sequence_number=r.sequence_number,
            timestamp=r.timestamp,
            event_type=r.event_type,
            principal_id=r.principal_id,
            tenant_id=r.tenant_id,
            session_id=r.session_id,
            canonical_payload=r.canonical_payload,
            previous_hash=r.previous_hash,
            record_hash=r.record_hash
        ) for r in records
    ]

@router.post("/verify", response_model=AuditVerifyReport)
async def verify_audit_chain(
    current_user: AuthenticatedUser = Depends(require_permission(Permission.VERIFY_AUDIT_CHAIN)),
    db: AsyncSession = Depends(get_db)
):
    report = await AuditService.verify_chain(db)
    return AuditVerifyReport(
        is_valid=report["is_valid"],
        records_checked=report["records_checked"],
        broken_at_sequence=report["broken_at_sequence"],
        details=report["details"],
        verification_time=report["verification_time"],
        head_hash=report.get("head_hash")
    )

@router.post("/tamper-simulate")
async def simulate_tamper_attack(
    sequence_number: int,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.VERIFY_AUDIT_CHAIN)),
    db: AsyncSession = Depends(get_db)
):
    res = await AuditService.simulate_tamper(db, sequence_number)
    return res

@router.post("/tamper-repair")
async def repair_tamper_attack(
    sequence_number: int,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.VERIFY_AUDIT_CHAIN)),
    db: AsyncSession = Depends(get_db)
):
    res = await AuditService.repair_tamper(db, sequence_number)
    return res
