import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.entities import EvaluationSession, ModelRegistry, InferenceRequest
from app.schemas.schemas import InferenceInput, InferenceResultResponse
from app.core.rbac import (
    get_current_user, AuthenticatedUser, require_permission, Permission
)
from app.services.llm_gateway import SecureLLMGateway, memory_manager
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService, INFERENCE_TOTAL

router = APIRouter(prefix="/inference", tags=["Secure LLM Gateway"])

@router.get("/models")
async def list_models(
    current_user: AuthenticatedUser = Depends(require_permission(Permission.VIEW_MODELS)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ModelRegistry).where(ModelRegistry.is_active == True)
    res = await db.execute(stmt)
    models = res.scalars().all()
    return [{
        "id": m.id,
        "name": m.name,
        "provider": m.provider,
        "context_window": m.context_window,
        "token_rate_limit_rpm": m.token_rate_limit_rpm,
        "safety_baseline_score": m.safety_baseline_score,
        "description": m.description
    } for m in models]

@router.post("", response_model=InferenceResultResponse)
async def process_inference_call(
    input_data: InferenceInput,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.INVOKE_INFERENCE)),
    db: AsyncSession = Depends(get_db)
):
    # Verify session and tenant boundary
    stmt = select(EvaluationSession).where(
        EvaluationSession.id == input_data.session_id,
        EvaluationSession.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()
    
    if not session_obj:
        raise HTTPException(
            status_code=404,
            detail=f"Evaluation session '{input_data.session_id}' not found in your tenant."
        )

    # Check session status
    if session_obj.status != "RUNNING":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot execute inference on session with status '{session_obj.status}'. Session must be RUNNING."
        )

    # Parse blue-team defensive guardrails
    try:
        guardrails = json.loads(session_obj.blue_team_guardrail_config_json)
    except Exception:
        guardrails = {}

    # Broker through Secure LLM Gateway
    gateway_result = await SecureLLMGateway.process_inference(
        session_id=session_obj.id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.user_id,
        model_id=input_data.model_id,
        prompt=input_data.prompt,
        blue_team_guardrails=guardrails
    )

    if not gateway_result.get("success", False):
        # Gateway rejected (e.g. rate limit, input token violation)
        if gateway_result.get("error") == "RATE_LIMIT_EXCEEDED":
            await SecurityService.log_security_event(
                db=db,
                event_type="RATE_LIMIT_EXCEEDED",
                severity="WARNING",
                source="LLM_GATEWAY",
                tenant_id=current_user.tenant_id,
                session_id=session_obj.id,
                principal_id=current_user.username,
                description=gateway_result["detail"]
            )
        raise HTTPException(
            status_code=gateway_result.get("status_code", 400),
            detail=gateway_result.get("detail", "Inference rejected by gateway")
        )

    # Record inference in database
    inf_record = InferenceRequest(
        session_id=session_obj.id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.user_id,
        model_id=input_data.model_id,
        prompt_token_count=gateway_result["prompt_token_count"],
        completion_token_count=gateway_result["completion_token_count"],
        latency_ms=gateway_result["latency_ms"],
        status_code=200,
        redacted_prompt_preview=gateway_result["redacted_prompt"][:500],
        redacted_response_preview=gateway_result["redacted_response"][:500],
        refusal_triggered=gateway_result["refusal_triggered"],
        jailbreak_detected=gateway_result["jailbreak_detected"],
        correlation_id=gateway_result["correlation_id"]
    )
    db.add(inf_record)
    await db.commit()

    # Increment Prometheus metrics
    status_label = "refused" if gateway_result["refusal_triggered"] else ("blocked" if gateway_result["blocked_by_guardrail"] else "success")
    INFERENCE_TOTAL.labels(model=input_data.model_id, status=status_label).inc()

    # Append to cryptographic audit chain
    await AuditService.record_event(
        db=db,
        event_type="MODEL_INFERENCE_REQUEST",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        session_id=session_obj.id,
        payload={
            "correlation_id": gateway_result["correlation_id"],
            "model_id": input_data.model_id,
            "tokens": gateway_result["prompt_token_count"] + gateway_result["completion_token_count"],
            "refusal_triggered": gateway_result["refusal_triggered"],
            "jailbreak_detected": gateway_result["jailbreak_detected"],
            "blocked_by_guardrail": gateway_result["blocked_by_guardrail"]
        }
    )

    return InferenceResultResponse(
        success=True,
        correlation_id=gateway_result["correlation_id"],
        session_id=session_obj.id,
        model_id=input_data.model_id,
        prompt_token_count=gateway_result["prompt_token_count"],
        completion_token_count=gateway_result["completion_token_count"],
        latency_ms=gateway_result["latency_ms"],
        response_text=gateway_result["response_text"],
        refusal_triggered=gateway_result["refusal_triggered"],
        jailbreak_detected=gateway_result["jailbreak_detected"],
        blocked_by_guardrail=gateway_result["blocked_by_guardrail"],
        guardrail_reason=gateway_result["guardrail_reason"],
        created_at=datetime.now(timezone.utc)
    )

@router.get("/history/{session_id}")
async def get_session_history(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify session belongs to user tenant
    stmt = select(EvaluationSession).where(
        EvaluationSession.id == session_id,
        EvaluationSession.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found in your tenant.")

    history = memory_manager.get_history(current_user.tenant_id, session_id)
    return {"session_id": session_id, "turns": history}
