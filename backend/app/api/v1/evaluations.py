import json
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.entities import EvaluationRun, EvaluationFinding, EvaluationSession, EvidenceExport
from app.schemas.schemas import FindingResponse, FindingMitigateInput
from app.core.rbac import (
    get_current_user, AuthenticatedUser, require_permission, Permission
)
from app.services.audit_service import AuditService, compute_canonical_json

router = APIRouter(prefix="/evaluations", tags=["Evaluations & Findings"])

@router.get("/runs")
async def list_evaluation_runs(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(EvaluationRun)
        .where(EvaluationRun.tenant_id == current_user.tenant_id)
        .order_by(desc(EvaluationRun.created_at))
    )
    res = await db.execute(stmt)
    runs = res.scalars().all()
    return [{
        "id": r.id,
        "session_id": r.session_id,
        "benchmark_name": r.benchmark_name,
        "total_tests": r.total_tests,
        "passed_defenses": r.passed_defenses,
        "bypassed_defenses": r.bypassed_defenses,
        "bypass_rate_pct": r.bypass_rate_pct,
        "status": r.status,
        "created_at": r.created_at
    } for r in runs]

@router.get("/findings", response_model=List[FindingResponse])
async def list_findings(
    session_id: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(EvaluationFinding)
        .where(EvaluationFinding.tenant_id == current_user.tenant_id)
        .order_by(desc(EvaluationFinding.created_at))
    )
    if session_id:
        query = query.where(EvaluationFinding.session_id == session_id)
        
    res = await db.execute(query)
    findings = res.scalars().all()
    
    return [
        FindingResponse(
            id=f.id,
            run_id=f.run_id,
            session_id=f.session_id,
            test_id=f.test_id,
            category=f.category,
            severity=f.severity,
            prompt_sample=f.prompt_sample,
            response_sample=f.response_sample,
            mitigation_status=f.mitigation_status,
            mitigation_notes=f.mitigation_notes,
            created_at=f.created_at
        ) for f in findings
    ]

@router.put("/findings/{finding_id}/mitigate")
async def update_finding_mitigation(
    finding_id: str,
    data: FindingMitigateInput,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.RECORD_MITIGATIONS)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EvaluationFinding).where(
        EvaluationFinding.id == finding_id,
        EvaluationFinding.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    finding = res.scalar_one_or_none()
    
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found in tenant.")
        
    finding.mitigation_status = data.mitigation_status
    finding.mitigation_notes = data.mitigation_notes
    await db.commit()

    # Append audit trail event
    await AuditService.record_event(
        db=db,
        event_type="FINDING_MITIGATION_RECORDED",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        session_id=finding.session_id,
        payload={
            "finding_id": finding.id,
            "test_id": finding.test_id,
            "status": data.mitigation_status,
            "notes": data.mitigation_notes
        }
    )

    return {"success": True, "finding_id": finding_id, "status": data.mitigation_status}

@router.get("/{session_id}/export")
async def export_evidence(
    session_id: str,
    format: str = "json", # json or csv
    current_user: AuthenticatedUser = Depends(require_permission(Permission.EXPORT_EVIDENCE)),
    db: AsyncSession = Depends(get_db)
):
    # Verify session and tenant boundary
    stmt = select(EvaluationSession).where(
        EvaluationSession.id == session_id,
        EvaluationSession.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found in tenant.")

    # Fetch findings
    f_stmt = select(EvaluationFinding).where(
        EvaluationFinding.session_id == session_id,
        EvaluationFinding.tenant_id == current_user.tenant_id
    )
    f_res = await db.execute(f_stmt)
    findings = f_res.scalars().all()

    evidence_payload = {
        "export_metadata": {
            "platform": "Bayora Secure AI Safety Infrastructure",
            "version": "1.0.0",
            "session_id": session_obj.id,
            "session_name": session_obj.name,
            "target_model": session_obj.target_model_id,
            "tenant_id": current_user.tenant_id,
            "exported_by": current_user.username,
            "export_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        },
        "findings_count": len(findings),
        "findings": [{
            "id": f.id,
            "test_id": f.test_id,
            "category": f.category,
            "severity": f.severity,
            "prompt_sample": f.prompt_sample,
            "response_sample": f.response_sample,
            "mitigation_status": f.mitigation_status,
            "mitigation_notes": f.mitigation_notes
        } for f in findings]
    }

    canonical_str = compute_canonical_json(evidence_payload)
    integrity_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
    evidence_payload["cryptographic_evidence_hash"] = integrity_hash

    # Save export record
    exp = EvidenceExport(
        session_id=session_obj.id,
        tenant_id=current_user.tenant_id,
        exported_by=current_user.username,
        file_format=format.upper(),
        integrity_hash=integrity_hash,
        record_count=len(findings)
    )
    db.add(exp)
    await db.commit()

    await AuditService.record_event(
        db=db,
        event_type="EVIDENCE_EXPORT_GENERATED",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        session_id=session_id,
        payload={
            "format": format.upper(),
            "records_count": len(findings),
            "integrity_hash": integrity_hash
        }
    )

    if format.lower() == "csv":
        import io
        import csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Test ID", "Category", "Severity", "Prompt Sample", "Response Sample", "Mitigation Status", "Mitigation Notes"])
        for f in findings:
            writer.writerow([f.test_id, f.category, f.severity, f.prompt_sample, f.response_sample, f.mitigation_status, f.mitigation_notes or ""])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=bayora_evidence_{session_id}.csv"}
        )

    return evidence_payload
