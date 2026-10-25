import pytest
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.core.rbac import AuthenticatedUser, Role, Permission, ROLE_PERMISSIONS

def test_password_hashing():
    raw = "SecureSecretPassword123!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_decoding():
    token = create_access_token(
        subject="user-123",
        tenant_id="tenant-hq",
        role="security_admin",
        username="sec_lead"
    )
    assert isinstance(token, str)
    
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["tenant_id"] == "tenant-hq"
    assert payload["role"] == "security_admin"
    assert payload["username"] == "sec_lead"

def test_rbac_deny_by_default_and_role_separation():
    # 1. Auditor Role
    auditor = AuthenticatedUser(
        user_id="u-auditor",
        username="auditor_jane",
        tenant_id="tenant-hq",
        role=Role.AUDITOR
    )
    assert auditor.has_permission(Permission.VIEW_AUDIT_LOGS) is True
    assert auditor.has_permission(Permission.VERIFY_AUDIT_CHAIN) is True
    assert auditor.has_permission(Permission.MANAGE_SESSIONS) is False  # Cannot create or manage sessions
    assert auditor.has_permission(Permission.EXECUTE_RED_TEAM) is False  # Cannot launch adversarial attacks
    assert auditor.has_permission(Permission.CONFIGURE_BLUE_TEAM) is False # Cannot mutate defensive rules

    # 2. Red Team Role
    red_op = AuthenticatedUser(
        user_id="u-red",
        username="red_ace",
        tenant_id="tenant-hq",
        role=Role.RED_TEAM
    )
    assert red_op.has_permission(Permission.EXECUTE_RED_TEAM) is True
    assert red_op.has_permission(Permission.INVOKE_INFERENCE) is True
    assert red_op.has_permission(Permission.CONFIGURE_BLUE_TEAM) is False # Denied: cannot alter defense
    assert red_op.has_permission(Permission.MANAGE_USERS) is False

    # 3. Blue Team Role
    blue_def = AuthenticatedUser(
        user_id="u-blue",
        username="blue_shield",
        tenant_id="tenant-hq",
        role=Role.BLUE_TEAM
    )
    assert blue_def.has_permission(Permission.CONFIGURE_BLUE_TEAM) is True
    assert blue_def.has_permission(Permission.RECORD_MITIGATIONS) is True
    assert blue_def.has_permission(Permission.EXECUTE_RED_TEAM) is False # Denied: cannot run red payloads
    assert blue_def.has_permission(Permission.MANAGE_POLICIES) is False

    # 4. Security Admin Role
    admin = AuthenticatedUser(
        user_id="u-admin",
        username="admin_boss",
        tenant_id="tenant-hq",
        role=Role.SECURITY_ADMIN
    )
    assert admin.has_permission(Permission.MANAGE_SESSIONS) is True
    assert admin.has_permission(Permission.MANAGE_USERS) is True
    assert admin.has_permission(Permission.MANAGE_POLICIES) is True
    assert admin.has_permission(Permission.VERIFY_AUDIT_CHAIN) is True
