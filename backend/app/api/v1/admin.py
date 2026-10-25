import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.entities import IsolationPolicy, ExecutionProfile, User, Tenant
from app.schemas.schemas import IsolationPolicyCreate, IsolationPolicyResponse, ExecutionProfileResponse, UserProfileResponse
from app.core.rbac import (
    get_current_user, AuthenticatedUser, require_permission, Permission
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/admin", tags=["Administration & Policies"])

@router.get("/policies", response_model=List[IsolationPolicyResponse])
async def list_policies(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(IsolationPolicy)
        .where(IsolationPolicy.tenant_id == current_user.tenant_id)
        .order_by(desc(IsolationPolicy.created_at))
    )
    res = await db.execute(stmt)
    policies = res.scalars().all()
    
    output = []
    for p in policies:
        try:
            egress = json.loads(p.network_egress_whitelist_json)
        except Exception:
            egress = []
        try:
            models = json.loads(p.allowed_model_endpoints_json)
        except Exception:
            models = []
        try:
            caps = json.loads(p.secret_capabilities_json)
        except Exception:
            caps = []
            
        output.append(IsolationPolicyResponse(
            id=p.id,
            name=p.name,
            cpu_limit_cores=p.cpu_limit_cores,
            memory_limit_mb=p.memory_limit_mb,
            timeout_seconds=p.timeout_seconds,
            network_ingress_allowed=p.network_ingress_allowed,
            network_egress_whitelist=egress,
            allowed_model_endpoints=models,
            secret_capabilities=caps,
            seccomp_profile_name=p.seccomp_profile_name,
            cgroups_version_enforced=p.cgroups_version_enforced
        ))
    return output

@router.post("/policies", response_model=IsolationPolicyResponse)
async def create_policy(
    data: IsolationPolicyCreate,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_POLICIES)),
    db: AsyncSession = Depends(get_db)
):
    pol = IsolationPolicy(
        tenant_id=current_user.tenant_id,
        name=data.name,
        cpu_limit_cores=data.cpu_limit_cores,
        memory_limit_mb=data.memory_limit_mb,
        timeout_seconds=data.timeout_seconds,
        network_ingress_allowed=data.network_ingress_allowed,
        network_egress_whitelist_json=json.dumps(data.network_egress_whitelist),
        allowed_model_endpoints_json=json.dumps(data.allowed_model_endpoints),
        secret_capabilities_json=json.dumps(data.secret_capabilities),
        seccomp_profile_name=data.seccomp_profile_name,
        cgroups_version_enforced="v2"
    )
    db.add(pol)
    await db.commit()
    await db.refresh(pol)

    await AuditService.record_event(
        db=db,
        event_type="ISOLATION_POLICY_CREATED",
        principal_id=current_user.username,
        tenant_id=current_user.tenant_id,
        payload={"policy_id": pol.id, "name": pol.name}
    )

    return IsolationPolicyResponse(
        id=pol.id,
        name=pol.name,
        cpu_limit_cores=pol.cpu_limit_cores,
        memory_limit_mb=pol.memory_limit_mb,
        timeout_seconds=pol.timeout_seconds,
        network_ingress_allowed=pol.network_ingress_allowed,
        network_egress_whitelist=data.network_egress_whitelist,
        allowed_model_endpoints=data.allowed_model_endpoints,
        secret_capabilities=data.secret_capabilities,
        seccomp_profile_name=pol.seccomp_profile_name,
        cgroups_version_enforced=pol.cgroups_version_enforced
    )

@router.get("/profiles", response_model=List[ExecutionProfileResponse])
async def list_profiles(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ExecutionProfile)
        .where(ExecutionProfile.tenant_id == current_user.tenant_id)
        .order_by(desc(ExecutionProfile.created_at))
    )
    res = await db.execute(stmt)
    profiles = res.scalars().all()
    
    return [
        ExecutionProfileResponse(
            id=p.id,
            name=p.name,
            runner_type=p.runner_type,
            container_image=p.container_image,
            default_command=p.default_command
        ) for p in profiles
    ]

@router.get("/users", response_model=List[UserProfileResponse])
async def list_tenant_users(
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_USERS)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    users = res.scalars().all()
    return [
        UserProfileResponse(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            tenant_id=u.tenant_id,
            role=u.role,
            is_active=u.is_active
        ) for u in users
    ]

@router.get("/tenants")
async def list_tenants(
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_SYSTEM)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tenant)
    res = await db.execute(stmt)
    tenants = res.scalars().all()
    return [{
        "id": t.id,
        "name": t.name,
        "slug": t.slug,
        "description": t.description,
        "max_concurrent_sessions": t.max_concurrent_sessions,
        "is_active": t.is_active
    } for t in tenants]
