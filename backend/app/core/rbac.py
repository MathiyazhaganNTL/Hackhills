from enum import Enum
from typing import List, Set, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)

class Role(str, Enum):
    SECURITY_ADMIN = "security_admin"
    RED_TEAM = "red_team"
    BLUE_TEAM = "blue_team"
    AUDITOR = "auditor"

class Permission(str, Enum):
    # Admin Controls
    MANAGE_USERS = "manage_users"
    MANAGE_POLICIES = "manage_policies"
    MANAGE_SESSIONS = "manage_sessions"
    TERMINATE_SESSIONS = "terminate_sessions"
    MANAGE_SYSTEM = "manage_system"
    
    # Session Viewing
    VIEW_SESSIONS = "view_sessions"
    
    # Red-Team Actions
    EXECUTE_RED_TEAM = "execute_red_team"
    VIEW_RED_TEAM_RESULTS = "view_red_team_results"
    
    # Blue-Team Actions
    CONFIGURE_BLUE_TEAM = "configure_blue_team"
    VIEW_BLUE_TEAM_DEFENSES = "view_blue_team_defenses"
    RECORD_MITIGATIONS = "record_mitigations"
    
    # Inference Actions
    INVOKE_INFERENCE = "invoke_inference"
    VIEW_MODELS = "view_models"
    
    # Audit & Security Events
    VIEW_SECURITY_EVENTS = "view_security_events"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    VERIFY_AUDIT_CHAIN = "verify_audit_chain"
    EXPORT_EVIDENCE = "export_evidence"

# Deny-by-default role permissions mapping
ROLE_PERMISSIONS: dict[Role, Set[Permission]] = {
    Role.SECURITY_ADMIN: {
        Permission.MANAGE_USERS,
        Permission.MANAGE_POLICIES,
        Permission.MANAGE_SESSIONS,
        Permission.TERMINATE_SESSIONS,
        Permission.MANAGE_SYSTEM,
        Permission.VIEW_SESSIONS,
        Permission.EXECUTE_RED_TEAM,
        Permission.VIEW_RED_TEAM_RESULTS,
        Permission.CONFIGURE_BLUE_TEAM,
        Permission.VIEW_BLUE_TEAM_DEFENSES,
        Permission.RECORD_MITIGATIONS,
        Permission.INVOKE_INFERENCE,
        Permission.VIEW_MODELS,
        Permission.VIEW_SECURITY_EVENTS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.VERIFY_AUDIT_CHAIN,
        Permission.EXPORT_EVIDENCE,
    },
    Role.RED_TEAM: {
        Permission.VIEW_SESSIONS,
        Permission.EXECUTE_RED_TEAM,
        Permission.VIEW_RED_TEAM_RESULTS,
        Permission.INVOKE_INFERENCE,
        Permission.VIEW_MODELS,
    },
    Role.BLUE_TEAM: {
        Permission.VIEW_SESSIONS,
        Permission.CONFIGURE_BLUE_TEAM,
        Permission.VIEW_BLUE_TEAM_DEFENSES,
        Permission.RECORD_MITIGATIONS,
        Permission.INVOKE_INFERENCE,
        Permission.VIEW_MODELS,
        Permission.EXPORT_EVIDENCE,
    },
    Role.AUDITOR: {
        Permission.VIEW_SESSIONS,
        Permission.VIEW_RED_TEAM_RESULTS,
        Permission.VIEW_BLUE_TEAM_DEFENSES,
        Permission.VIEW_SECURITY_EVENTS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.VERIFY_AUDIT_CHAIN,
        Permission.EXPORT_EVIDENCE,
        Permission.VIEW_MODELS,
    },
}

class AuthenticatedUser:
    def __init__(self, user_id: str, username: str, tenant_id: str, role: Role):
        self.user_id = user_id
        self.username = username
        self.tenant_id = tenant_id
        self.role = role
        self.permissions: Set[Permission] = ROLE_PERMISSIONS.get(role, set())

    def has_permission(self, permission: Permission) -> bool:
        return permission in self.permissions

    def can_access_tenant(self, target_tenant_id: str) -> bool:
        # Strict tenant boundary enforcement
        return self.tenant_id == target_tenant_id

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> AuthenticatedUser:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token expired or cryptographic signature invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    username = payload.get("username", "")
    tenant_id = payload.get("tenant_id")
    role_str = payload.get("role")
    
    if not user_id or not tenant_id or not role_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims: missing required identity parameters",
        )
        
    try:
        role = Role(role_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unknown or unrecognized role: {role_str}",
        )
        
    return AuthenticatedUser(user_id=user_id, username=username, tenant_id=tenant_id, role=role)

def require_permission(permission: Permission):
    async def permission_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{current_user.role.value}' lacks required permission '{permission.value}'",
            )
        return current_user
    return permission_checker
