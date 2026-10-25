from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.entities import User, Tenant
from app.schemas.schemas import LoginRequest, TokenResponse, UserProfileResponse
from app.core.security import verify_password, create_access_token
from app.core.rbac import get_current_user, AuthenticatedUser, ROLE_PERMISSIONS, Role
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.username == login_data.username)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        # Log authentication failure event
        await SecurityService.log_security_event(
            db=db,
            event_type="AUTHENTICATION_FAILURE",
            severity="WARNING",
            source="AUTH_ENDPOINT",
            description=f"Failed login attempt for username '{login_data.username}' with invalid credentials.",
            principal_id=login_data.username
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact security administrator."
        )

    # Fetch tenant
    t_stmt = select(Tenant).where(Tenant.id == user.tenant_id)
    t_res = await db.execute(t_stmt)
    tenant = t_res.scalar_one_or_none()
    tenant_name = tenant.name if tenant else "Default Tenant"

    token = create_access_token(
        subject=user.id,
        tenant_id=user.tenant_id,
        role=user.role,
        username=user.username
    )
    
    # Audit trail record for authenticated session creation
    await AuditService.record_event(
        db=db,
        event_type="USER_AUTHENTICATION_SUCCESS",
        principal_id=user.username,
        tenant_id=user.tenant_id,
        payload={"user_id": user.id, "role": user.role, "tenant_id": user.tenant_id}
    )

    role_enum = Role(user.role)
    perms = [p.value for p in ROLE_PERMISSIONS.get(role_enum, set())]

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        tenant_id=user.tenant_id,
        tenant_name=tenant_name,
        role=user.role,
        permissions=perms
    )

@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: AuthenticatedUser = Depends(get_current_user)):
    return UserProfileResponse(
        id=current_user.user_id,
        username=current_user.username,
        full_name=f"{current_user.username} ({current_user.role.value})",
        tenant_id=current_user.tenant_id,
        role=current_user.role.value,
        is_active=True
    )
