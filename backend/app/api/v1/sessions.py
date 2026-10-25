import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.entities import EvaluationSession, IsolationPolicy, ExecutionProfile, ModelRegistry
from app.schemas.schemas import SessionCreate, SessionResponse
from app.core.rbac import (
    get_current_user, AuthenticatedUser, require_permission, Permission, Role
)
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService
from app.services.isolation_engine import IsolationPolicyEngine

router = APIRouter(prefix="/sessions", tags=["Evaluation Sessions"])

@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Enforce strict tenant boundary in query
    stmt = (
        select(EvaluationSession)
        .where(EvaluationSession.tenant_id == current_user.tenant_id)
        .order_by(desc(EvaluationSession.created_at))
    )
    res = await db.execute(stmt)
    sessions = res.scalars().all()
    
    output = []
    for s in sessions:
        try:
            guardrails = json.loads(s.blue_team_guardrail_config_json)
        except Exception:
            guardrails = {}
            
        output.append(SessionResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            tenant_id=s.tenant_id,
            created_by_user_id=s.created_by_user_id,
            status=s.status,
            target_model_id=s.target_model_id,
            execution_profile_id=s.execution_profile_id,
            isolation_policy_id=s.isolation_policy_id,
            blue_team_guardrail_config=guardrails,
            started_at=s.started_at,
            completed_at=s.completed_at,
            termination_reason=s.termination_reason,
            created_at=s.created_at,
            updated_at=s.updated_at
        ))
    return output

@router.post("", response_model=SessionResponse)
async def create_session(
    data: SessionCreate,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_SESSIONS)),
    db: AsyncSession = Depends(get_db)
):
    # Verify policy belongs to tenant
    p_stmt = select(IsolationPolicy).where(
        IsolationPolicy.id == data.isolation_policy_id,
        IsolationPolicy.tenant_id == current_user.tenant_id
    )
    p_res = await db.execute(p_stmt)
    if not p_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invalid isolation_policy_id for this tenant.")

    guardrails_json = json.dumps(data.blue_team_guardrail_config or {
        "pre_inference_regex": ["ignore previous instructions", "system override"],
        "semantic_toxicity_threshold": 0.7,
        "refusal_override_prevention": True
    })

    new_session = EvaluationSession(
        tenant_id=current_user.tenant_id,
        name=data.name,
        description=data.description,
        created_by_user_id=current_user.user_id,
        status="DRAFT",
        execution_profile_id=data.execution_profile_id,
        isolation_policy_id=data.isolation_policy_id,
        target_model_id=data.target_model_id,
        blue_team_guardrail_config_json=guardrails_json
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    # Append to cryptographic audit chain
    await AuditService.record_event(
        db=db,
        event_type="SESSION_CREATED",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        session_id=new_session.id,
        payload={
            "session_id": new_session.id,
            "name": new_session.name,
            "target_model": new_session.target_model_id,
            "initial_status": "DRAFT"
        }
    )

    return SessionResponse(
        id=new_session.id,
        name=new_session.name,
        description=new_session.description,
        tenant_id=new_session.tenant_id,
        created_by_user_id=new_session.created_by_user_id,
        status=new_session.status,
        target_model_id=new_session.target_model_id,
        execution_profile_id=new_session.execution_profile_id,
        isolation_policy_id=new_session.isolation_policy_id,
        blue_team_guardrail_config=json.loads(guardrails_json),
        started_at=new_session.started_at,
        completed_at=new_session.completed_at,
        termination_reason=new_session.termination_reason,
        created_at=new_session.created_at,
        updated_at=new_session.updated_at
    )

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EvaluationSession).where(EvaluationSession.id == session_id)
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()
    
    if not session_obj:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
        
    # STRICT TENANT BOUNDARY CHECK
    if session_obj.tenant_id != current_user.tenant_id:
        # Cross-tenant violation! Log security alert
        await SecurityService.log_security_event(
            db=db,
            event_type="UNAUTHORIZED_CROSS_TENANT_ATTEMPT",
            severity="CRITICAL",
            source="SESSION_ACCESS_GUARD",
            tenant_id=session_obj.tenant_id,
            session_id=session_id,
            principal_id=current_user.username,
            description=f"User '{current_user.username}' from tenant '{current_user.tenant_id}' attempted cross-tenant access to session '{session_id}' owned by tenant '{session_obj.tenant_id}'.",
            metadata={"caller_tenant": current_user.tenant_id, "target_session": session_id}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cross-tenant resource access is prohibited by security policy."
        )

    return SessionResponse(
        id=session_obj.id,
        name=session_obj.name,
        description=session_obj.description,
        tenant_id=session_obj.tenant_id,
        created_by_user_id=session_obj.created_by_user_id,
        status=session_obj.status,
        target_model_id=session_obj.target_model_id,
        execution_profile_id=session_obj.execution_profile_id,
        isolation_policy_id=session_obj.isolation_policy_id,
        blue_team_guardrail_config=json.loads(session_obj.blue_team_guardrail_config_json),
        started_at=session_obj.started_at,
        completed_at=session_obj.completed_at,
        termination_reason=session_obj.termination_reason,
        created_at=session_obj.created_at,
        updated_at=session_obj.updated_at
    )

@router.post("/{session_id}/start")
async def start_session(
    session_id: str,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_SESSIONS)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EvaluationSession).where(
        EvaluationSession.id == session_id,
        EvaluationSession.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found in tenant.")

    # Validate state transition
    if not IsolationPolicyEngine.validate_transition(session_obj.status, "RUNNING"):
        # Log invalid state transition security event
        await SecurityService.log_security_event(
            db=db,
            event_type="INVALID_STATE_TRANSITION_ATTEMPT",
            severity="WARNING",
            source="SESSION_LIFECYCLE_GUARD",
            tenant_id=current_user.tenant_id,
            session_id=session_id,
            principal_id=current_user.username,
            description=f"Attempted invalid transition from status '{session_obj.status}' to 'RUNNING'. Action denied."
        )
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition session from '{session_obj.status}' to 'RUNNING'. Terminal or invalid state."
        )

    # Validate isolation feasibility
    prof_stmt = select(ExecutionProfile).where(ExecutionProfile.id == session_obj.execution_profile_id)
    prof_res = await db.execute(prof_stmt)
    profile = prof_res.scalar_one_or_none()
    
    runner_type = profile.runner_type if profile else "LOCAL_SANDBOX"
    eval_result = IsolationPolicyEngine.evaluate_isolation_feasibility(runner_type, {})
    
    if not eval_result["can_execute"]:
        # FAIL CLOSED
        session_obj.status = "FAILED"
        session_obj.termination_reason = eval_result["reason"]
        await db.commit()
        
        await SecurityService.log_security_event(
            db=db,
            event_type="CONTAINER_ISOLATION_FAILURE",
            severity="CRITICAL",
            source="ISOLATION_ENGINE",
            tenant_id=current_user.tenant_id,
            session_id=session_id,
            principal_id=current_user.username,
            description=eval_result["reason"]
        )
        raise HTTPException(status_code=503, detail=eval_result["reason"])

    session_obj.status = "RUNNING"
    session_obj.started_at = datetime.now(timezone.utc)
    await db.commit()

    await AuditService.record_event(
        db=db,
        event_type="SESSION_STARTED",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        session_id=session_id,
        payload={"status": "RUNNING", "isolation_mode": runner_type}
    )

    return {"success": True, "session_id": session_id, "status": "RUNNING"}

@router.post("/{session_id}/terminate")
async def terminate_session(
    session_id: str,
    reason: Optional[str] = "Operator requested manual termination",
    current_user: AuthenticatedUser = Depends(require_permission(Permission.TERMINATE_SESSIONS)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EvaluationSession).where(
        EvaluationSession.id == session_id,
        EvaluationSession.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found in tenant.")

    session_obj.status = "TERMINATED"
    session_obj.completed_at = datetime.now(timezone.utc)
    session_obj.termination_reason = reason
    await db.commit()

    await AuditService.record_event(
        db=db,
        event_type="SESSION_TERMINATED",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        session_id=session_id,
        payload={"status": "TERMINATED", "reason": reason}
    )

    return {"success": True, "session_id": session_id, "status": "TERMINATED"}

@router.put("/{session_id}/guardrails")
async def update_guardrails(
    session_id: str,
    guardrail_config: dict,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.CONFIGURE_BLUE_TEAM)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EvaluationSession).where(
        EvaluationSession.id == session_id,
        EvaluationSession.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found in tenant.")

    session_obj.blue_team_guardrail_config_json = json.dumps(guardrail_config)
    await db.commit()

    await AuditService.record_event(
        db=db,
        event_type="BLUE_TEAM_GUARDRAILS_UPDATED",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        session_id=session_id,
        payload={"rules_count": len(guardrail_config.get("pre_inference_regex", []))}
    )

    return {"success": True, "guardrails": guardrail_config}
