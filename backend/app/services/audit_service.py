import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import AuditRecord, AuditAnchor

def compute_canonical_json(data: Any) -> str:
    """Produces deterministic canonical JSON serialization (sorted keys, minimal whitespace)."""
    return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def calculate_audit_hash(
    sequence_number: int,
    timestamp: str,
    event_type: str,
    principal_id: str,
    tenant_id: Optional[str],
    session_id: Optional[str],
    canonical_payload: str,
    previous_hash: str
) -> str:
    hasher = hashlib.sha256()
    hasher.update(str(sequence_number).encode("utf-8"))
    hasher.update(timestamp.encode("utf-8"))
    hasher.update(event_type.encode("utf-8"))
    hasher.update(principal_id.encode("utf-8"))
    hasher.update((tenant_id or "").encode("utf-8"))
    hasher.update((session_id or "").encode("utf-8"))
    hasher.update(canonical_payload.encode("utf-8"))
    hasher.update(previous_hash.encode("utf-8"))
    return hasher.hexdigest()

class AuditService:
    @staticmethod
    async def record_event(
        db: AsyncSession,
        event_type: str,
        principal_id: str,
        payload: Dict[str, Any],
        tenant_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> AuditRecord:
        """Appends a new cryptographically chained audit record."""
        # Find latest record to retrieve previous sequence and previous hash
        stmt = select(AuditRecord).order_by(desc(AuditRecord.sequence_number)).limit(1)
        res = await db.execute(stmt)
        latest_record = res.scalar_one_or_none()
        
        if latest_record:
            next_sequence = latest_record.sequence_number + 1
            prev_hash = latest_record.record_hash
        else:
            next_sequence = 0
            prev_hash = "0" * 64
            
        timestamp_str = datetime.now(timezone.utc).isoformat()
        canonical_payload = compute_canonical_json(payload)
        
        record_hash = calculate_audit_hash(
            sequence_number=next_sequence,
            timestamp=timestamp_str,
            event_type=event_type,
            principal_id=principal_id,
            tenant_id=tenant_id,
            session_id=session_id,
            canonical_payload=canonical_payload,
            previous_hash=prev_hash
        )
        
        record = AuditRecord(
            sequence_number=next_sequence,
            timestamp=timestamp_str,
            event_type=event_type,
            principal_id=principal_id,
            tenant_id=tenant_id,
            session_id=session_id,
            canonical_payload=canonical_payload,
            previous_hash=prev_hash,
            record_hash=record_hash
        )
        
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def verify_chain(db: AsyncSession) -> Dict[str, Any]:
        """
        Independently audits and validates the entire cryptographic hash-chain.
        Detects:
        - Content modifications (payload/event tampering)
        - Broken linkages (reordering, insertions, deletions)
        - Sequence numbering gaps
        """
        stmt = select(AuditRecord).order_by(AuditRecord.sequence_number.asc())
        res = await db.execute(stmt)
        records = list(res.scalars().all())
        
        if not records:
            return {
                "is_valid": True,
                "records_checked": 0,
                "broken_at_sequence": None,
                "details": "Audit chain is empty. No records to verify.",
                "verification_time": datetime.now(timezone.utc).isoformat()
            }
            
        expected_prev_hash = "0" * 64
        expected_sequence = 0
        
        for idx, rec in enumerate(records):
            # 1. Check sequence monotonicity
            if rec.sequence_number != expected_sequence:
                return {
                    "is_valid": False,
                    "records_checked": idx,
                    "broken_at_sequence": rec.sequence_number,
                    "details": f"Sequence discontinuity detected: expected {expected_sequence}, found {rec.sequence_number}. Possible record deletion or unauthorized insertion.",
                    "verification_time": datetime.now(timezone.utc).isoformat()
                }
                
            # 2. Check previous hash linkage (except genesis block index 0)
            if idx > 0 and rec.previous_hash != expected_prev_hash:
                return {
                    "is_valid": False,
                    "records_checked": idx,
                    "broken_at_sequence": rec.sequence_number,
                    "details": f"Hash chain linkage broken at sequence {rec.sequence_number}: previous_hash '{rec.previous_hash[:16]}...' does not match parent record_hash '{expected_prev_hash[:16]}...'.",
                    "verification_time": datetime.now(timezone.utc).isoformat()
                }
                
            # 3. Recompute and verify record hash
            recomputed = calculate_audit_hash(
                sequence_number=rec.sequence_number,
                timestamp=rec.timestamp,
                event_type=rec.event_type,
                principal_id=rec.principal_id,
                tenant_id=rec.tenant_id,
                session_id=rec.session_id,
                canonical_payload=rec.canonical_payload,
                previous_hash=rec.previous_hash
            )
            
            if recomputed != rec.record_hash:
                return {
                    "is_valid": False,
                    "records_checked": idx,
                    "broken_at_sequence": rec.sequence_number,
                    "details": f"Cryptographic integrity violation at sequence {rec.sequence_number}: recorded hash '{rec.record_hash[:16]}...' does not match recomputed SHA-256 '{recomputed[:16]}...'. Record has been modified in storage.",
                    "verification_time": datetime.now(timezone.utc).isoformat()
                }
                
            expected_prev_hash = rec.record_hash
            expected_sequence += 1
            
        return {
            "is_valid": True,
            "records_checked": len(records),
            "broken_at_sequence": None,
            "details": f"Cryptographic hash chain intact across all {len(records)} records. Zero discrepancies, omissions, or unauthorized modifications detected.",
            "head_hash": expected_prev_hash,
            "verification_time": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    async def simulate_tamper(db: AsyncSession, sequence_number: int) -> Dict[str, Any]:
        """
        Simulates an unauthorized database modification to prove that the verification
        engine mathematically detects tampering.
        """
        stmt = select(AuditRecord).where(AuditRecord.sequence_number == sequence_number)
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()
        
        if not record:
            return {"success": False, "error": f"Record with sequence {sequence_number} not found"}
            
        # Corrupt the payload without recomputing the cryptographic hash
        record.canonical_payload = record.canonical_payload + '/*TAMPERED_UNAUTHORIZED_DATA*/'
        await db.commit()
        
        return {
            "success": True,
            "tampered_sequence": sequence_number,
            "message": f"Record at sequence {sequence_number} corrupted without hash update. Run audit verification to observe detection."
        }
        
    @staticmethod
    async def repair_tamper(db: AsyncSession, sequence_number: int) -> Dict[str, Any]:
        """
        Restores valid hash for tampered record or resets test state.
        """
        stmt = select(AuditRecord).where(AuditRecord.sequence_number == sequence_number)
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()
        
        if not record:
            return {"success": False, "error": f"Record with sequence {sequence_number} not found"}
            
        # Clean up any tampered marker
        record.canonical_payload = record.canonical_payload.replace('/*TAMPERED_UNAUTHORIZED_DATA*/', '')
        # Recompute valid hash
        record.record_hash = calculate_audit_hash(
            sequence_number=record.sequence_number,
            timestamp=record.timestamp,
            event_type=record.event_type,
            principal_id=record.principal_id,
            tenant_id=record.tenant_id,
            session_id=record.session_id,
            canonical_payload=record.canonical_payload,
            previous_hash=record.previous_hash
        )
        await db.commit()
        return {"success": True, "repaired_sequence": sequence_number}
