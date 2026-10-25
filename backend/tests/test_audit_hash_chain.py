import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.entities import Base, AuditRecord
from app.services.audit_service import AuditService

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()

@pytest.mark.asyncio
async def test_audit_hash_chain_append_and_verify(db_session):
    # 1. Record series of events
    rec1 = await AuditService.record_event(
        db=db_session,
        event_type="TEST_EVENT_1",
        principal_id="admin_tester",
        payload={"action": "INITIALIZE", "param": 100},
        tenant_id="tenant-001"
    )
    assert rec1.sequence_number == 0
    assert rec1.previous_hash == "0" * 64
    assert len(rec1.record_hash) == 64

    rec2 = await AuditService.record_event(
        db=db_session,
        event_type="TEST_EVENT_2",
        principal_id="red_operator",
        payload={"action": "RUN_ADVERSARIAL_PAYLOAD", "vector": "jailbreak"},
        tenant_id="tenant-001",
        session_id="session-123"
    )
    assert rec2.sequence_number == 1
    assert rec2.previous_hash == rec1.record_hash
    assert len(rec2.record_hash) == 64

    rec3 = await AuditService.record_event(
        db=db_session,
        event_type="TEST_EVENT_3",
        principal_id="blue_defender",
        payload={"action": "DEPLOY_MITIGATION", "rule": "filter_dan"},
        tenant_id="tenant-001",
        session_id="session-123"
    )
    assert rec3.sequence_number == 2
    assert rec3.previous_hash == rec2.record_hash

    # 2. Verify complete chain
    report = await AuditService.verify_chain(db_session)
    assert report["is_valid"] is True
    assert report["records_checked"] == 3
    assert report["broken_at_sequence"] is None

@pytest.mark.asyncio
async def test_audit_hash_chain_tamper_detection(db_session):
    # 1. Create records
    for i in range(5):
        await AuditService.record_event(
            db=db_session,
            event_type=f"STEP_{i}",
            principal_id="system",
            payload={"step": i}
        )

    # Verify pristine chain
    initial_report = await AuditService.verify_chain(db_session)
    assert initial_report["is_valid"] is True

    # 2. Tamper with record sequence 2
    tamper_res = await AuditService.simulate_tamper(db_session, sequence_number=2)
    assert tamper_res["success"] is True

    # 3. Independent audit verification MUST detect tampering
    tampered_report = await AuditService.verify_chain(db_session)
    assert tampered_report["is_valid"] is False
    assert tampered_report["broken_at_sequence"] == 2
    assert "Cryptographic integrity violation" in tampered_report["details"]

    # 4. Repair and re-verify
    repair_res = await AuditService.repair_tamper(db_session, sequence_number=2)
    assert repair_res["success"] is True
    
    restored_report = await AuditService.verify_chain(db_session)
    assert restored_report["is_valid"] is True
