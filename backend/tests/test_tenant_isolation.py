import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db
from app.core.security import create_access_token

@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()

@pytest.mark.asyncio
async def test_tenant_isolation_boundary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Tenant 1 Admin Token
        t1_token = create_access_token(
            subject="user-admin-01",
            tenant_id="tenant-hq-001",
            role="security_admin",
            username="admin"
        )
        
        # Tenant 2 User Token (Contractor Tenant)
        t2_token = create_access_token(
            subject="user-ext-admin-02",
            tenant_id="tenant-ext-002",
            role="security_admin",
            username="tenant2_admin"
        )

        # 1. Tenant 1 Admin accesses Tenant 1 Session (session-sec-101)
        resp1 = await client.get(
            "/api/v1/sessions/session-sec-101",
            headers={"Authorization": f"Bearer {t1_token}"}
        )
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["id"] == "session-sec-101"
        assert data1["tenant_id"] == "tenant-hq-001"

        # 2. Tenant 2 User attempts to access Tenant 1 Session (session-sec-101)
        # MUST BE STRICTLY DENIED with 403 Forbidden!
        resp2 = await client.get(
            "/api/v1/sessions/session-sec-101",
            headers={"Authorization": f"Bearer {t2_token}"}
        )
        assert resp2.status_code == 403
        err2 = resp2.json()
        assert "Cross-tenant resource access is prohibited" in err2["detail"]

        # 3. Check that security event was generated for the cross-tenant attempt
        sec_resp = await client.get(
            "/api/v1/security/events",
            headers={"Authorization": f"Bearer {t1_token}"}
        )
        assert sec_resp.status_code == 200
        events = sec_resp.json()
        cross_tenant_events = [e for e in events if e["event_type"] == "UNAUTHORIZED_CROSS_TENANT_ATTEMPT"]
        assert len(cross_tenant_events) > 0
