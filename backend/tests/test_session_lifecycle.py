import pytest
from app.services.isolation_engine import IsolationPolicyEngine, IsolationCapabilityDetector

def test_session_state_machine_validations():
    # Valid transitions
    assert IsolationPolicyEngine.validate_transition("DRAFT", "QUEUED") is True
    assert IsolationPolicyEngine.validate_transition("QUEUED", "RUNNING") is True
    assert IsolationPolicyEngine.validate_transition("RUNNING", "COMPLETED") is True
    assert IsolationPolicyEngine.validate_transition("RUNNING", "TERMINATED") is True
    assert IsolationPolicyEngine.validate_transition("DRAFT", "TERMINATED") is True

    # Invalid / Illegal transitions
    assert IsolationPolicyEngine.validate_transition("COMPLETED", "RUNNING") is False
    assert IsolationPolicyEngine.validate_transition("TERMINATED", "RUNNING") is False
    assert IsolationPolicyEngine.validate_transition("FAILED", "RUNNING") is False
    assert IsolationPolicyEngine.validate_transition("DRAFT", "COMPLETED") is False

def test_isolation_policy_fail_closed_guarantee():
    caps = IsolationCapabilityDetector.detect()
    
    # If Docker engine is not available on host, requesting CONTAINER_ROOTLESS must fail closed
    if not caps["docker_engine_available"]:
        result = IsolationPolicyEngine.evaluate_isolation_feasibility("CONTAINER_ROOTLESS", {})
        assert result["can_execute"] is False
        assert result["fail_closed"] is True
        assert "FAIL_CLOSED" in result["reason"]
        
    # Local sandbox with ephemeral isolation allows execution
    sandbox_result = IsolationPolicyEngine.evaluate_isolation_feasibility("LOCAL_SANDBOX", {})
    assert sandbox_result["can_execute"] is True
    assert sandbox_result["fail_closed"] is False
    assert len(sandbox_result["enforced_controls"]) > 0
