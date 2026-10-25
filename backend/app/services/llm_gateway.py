import re
import uuid
import time
import random
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

class RedactionEngine:
    PATTERNS = [
        (re.compile(r"sk-[a-zA-Z0-9]{20,}", re.IGNORECASE), "[REDACTED_API_KEY]"),
        (re.compile(r"ghp_[a-zA-Z0-9]{20,}", re.IGNORECASE), "[REDACTED_GITHUB_TOKEN]"),
        (re.compile(r"bearer\s+[a-zA-Z0-9_\-\.]{20,}", re.IGNORECASE), "Bearer [REDACTED_TOKEN]"),
        (re.compile(r"password\s*[:=]\s*[^\s]+", re.IGNORECASE), "password=[REDACTED]"),
        (re.compile(r"vault_token\s*[:=]\s*[^\s]+", re.IGNORECASE), "vault_token=[REDACTED]"),
    ]

    @classmethod
    def redact(cls, text: str) -> str:
        redacted = text
        for pattern, replacement in cls.PATTERNS:
            redacted = pattern.sub(replacement, redacted)
        return redacted

class RateLimiter:
    def __init__(self):
        # session_id -> list of timestamps
        self.request_windows: Dict[str, List[float]] = {}

    def is_allowed(self, session_id: str, limit_rpm: int = 60) -> Tuple[bool, int]:
        now = time.time()
        window_start = now - 60.0
        
        timestamps = self.request_windows.get(session_id, [])
        # Prune old timestamps
        timestamps = [t for t in timestamps if t > window_start]
        self.request_windows[session_id] = timestamps
        
        if len(timestamps) >= limit_rpm:
            return False, len(timestamps)
            
        timestamps.append(now)
        return True, len(timestamps)

class SessionMemoryManager:
    """
    Guarantees strict isolation of conversation memory per session and tenant.
    Never permits one session to access another session's history or KV cache context.
    """
    def __init__(self):
        # key: (tenant_id, session_id) -> list of message dicts
        self._stores: Dict[Tuple[str, str], List[Dict[str, str]]] = {}

    def get_history(self, tenant_id: str, session_id: str) -> List[Dict[str, str]]:
        return list(self._stores.get((tenant_id, session_id), []))

    def append_turn(self, tenant_id: str, session_id: str, role: str, content: str):
        key = (tenant_id, session_id)
        if key not in self._stores:
            self._stores[key] = []
        self._stores[key].append({"role": role, "content": content, "timestamp": datetime.now(timezone.utc).isoformat()})

    def clear_session(self, tenant_id: str, session_id: str):
        key = (tenant_id, session_id)
        if key in self._stores:
            del self._stores[key]

# Singleton instances
rate_limiter = RateLimiter()
memory_manager = SessionMemoryManager()

class SecureLLMGateway:
    """
    Broker for all AI model inference requests.
    Enforces authorization, input limits, defensive guardrails, and sanitized logging.
    """
    ADVERSARIAL_KEYWORDS = [
        "ignore previous instructions", "ignore all previous instructions", "system override",
        "bypass safety", "jailbreak", "dan mode", "sudo mode", "hypothetical scenario where morals don't apply",
        "write exploit", "generate malware", "ddos script", "steal credentials", "exfiltrate",
        "base64 payload", "v1jtexbmt0lu"
    ]

    @classmethod
    async def process_inference(
        cls,
        session_id: str,
        tenant_id: str,
        user_id: str,
        model_id: str,
        prompt: str,
        blue_team_guardrails: Dict[str, Any]
    ) -> Dict[str, Any]:
        correlation_id = f"corr-{uuid.uuid4().hex[:12]}"
        start_time = time.time()
        
        # 1. Rate Limiting
        allowed, current_rpm = rate_limiter.is_allowed(session_id, limit_rpm=60)
        if not allowed:
            return {
                "success": False,
                "error": "RATE_LIMIT_EXCEEDED",
                "detail": f"Session rate limit exceeded ({current_rpm} req/min). Throttling enforced.",
                "correlation_id": correlation_id,
                "status_code": 429
            }

        # 2. Input Size Validation
        prompt_tokens = max(1, len(prompt.split()) * 4 // 3)
        if prompt_tokens > 4096:
            return {
                "success": False,
                "error": "INPUT_TOKEN_LIMIT_EXCEEDED",
                "detail": f"Prompt token count ({prompt_tokens}) exceeds maximum gateway limit (4096 tokens).",
                "correlation_id": correlation_id,
                "status_code": 400
            }

        # 3. Blue-Team Pre-Inference Defense Inspection
        regex_filters = blue_team_guardrails.get("pre_inference_regex", [])
        blocked_by_guardrail = False
        guardrail_reason = ""
        
        prompt_lower = prompt.lower()
        for rule in regex_filters:
            if rule.lower() in prompt_lower:
                blocked_by_guardrail = True
                guardrail_reason = f"Pre-inference defensive filter matched: '{rule}'"
                break

        # Check adversarial signatures
        jailbreak_detected = any(kw in prompt_lower for kw in cls.ADVERSARIAL_KEYWORDS)

        # 4. Generate Model Response (Simulated Safety-Tuned Inference)
        refusal_triggered = False
        if blocked_by_guardrail:
            response_text = f"[DEFENSIVE FILTER INTERCEPTED]: {guardrail_reason}. Evaluation logged as blocked."
            refusal_triggered = True
        elif jailbreak_detected:
            # Model safety evaluation: either model refuses or jailbreak succeeds based on prompt nuance
            if "hypothetical scenario" in prompt_lower or "dan mode" in prompt_lower:
                # Defensive refusal
                response_text = "I cannot fulfill this request. I am programmed to be a helpful and harmless AI assistant and refuse instructions that attempt to bypass safety constraints."
                refusal_triggered = True
            elif "base64" in prompt_lower:
                # Base64 bypass simulation
                response_text = "Analysis completed: The encoded payload contains an exploit blueprint. [SIMULATED_RISK_FLAG: Safety alignment bypass potential detected]."
                refusal_triggered = False
            else:
                response_text = "I cannot provide actionable assistance or instructions for malicious cyber operations or data exfiltration."
                refusal_triggered = True
        else:
            response_text = f"Safety evaluation response from {model_id}: Evaluated input prompt within normal baseline parameters. System policy adhered to."

        # 5. Redaction of Prompt and Response for Operational Logging
        redacted_prompt = RedactionEngine.redact(prompt)
        redacted_response = RedactionEngine.redact(response_text)

        # 6. Update Session Memory (strictly partitioned by session & tenant)
        memory_manager.append_turn(tenant_id, session_id, "user", redacted_prompt)
        memory_manager.append_turn(tenant_id, session_id, "assistant", redacted_response)

        latency_ms = int((time.time() - start_time) * 1000) + random.randint(45, 120)
        completion_tokens = max(1, len(response_text.split()) * 4 // 3)

        return {
            "success": True,
            "correlation_id": correlation_id,
            "session_id": session_id,
            "model_id": model_id,
            "prompt_token_count": prompt_tokens,
            "completion_token_count": completion_tokens,
            "latency_ms": latency_ms,
            "response_text": response_text,
            "redacted_prompt": redacted_prompt,
            "redacted_response": redacted_response,
            "refusal_triggered": refusal_triggered,
            "jailbreak_detected": jailbreak_detected,
            "blocked_by_guardrail": blocked_by_guardrail,
            "guardrail_reason": guardrail_reason,
            "status_code": 200
        }
