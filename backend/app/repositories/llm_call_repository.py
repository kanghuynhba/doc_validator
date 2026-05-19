"""Repository for persisting LLM call metadata.

Stores the prompt, raw response, model used, token counts (when available),
latency, and whether a fallback was triggered.  Useful for auditing and
analytics without coupling the LLM service to the database directly.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.models.llm_call import LLMCall


class LLMCallRepository:
    """Persists metadata about each LLM call for observability and auditing."""

    def __init__(self, db) -> None:
        self._db = db

    def log_call(
        self,
        session_id: int | None,
        *,
        prompt: str,
        response: str,
        model: str,
        prompt_tokens: int | None = None,
        completion_tokens: int | None = None,
        latency_s: float | None = None,
        used_fallback: bool = False,
        call_type: str = "completion",
    ) -> LLMCall:
        """Create a record of an LLM invocation."""
        record = LLMCall(
            session_id=session_id,
            model_name=model,
            prompt_text=prompt,
            response_text=response,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_seconds=latency_s,
            used_fallback=used_fallback,
            call_type=call_type,
            created_at=datetime.now(timezone.utc),
        )
        self._db.add(record)
        self._db.flush()
        return record

    def get_by_session(self, session_id: int) -> list[LLMCall]:
        return self._db.query(LLMCall).filter(LLMCall.session_id == session_id).all()

    def count_by_session(self, session_id: int) -> int:
        return self._db.query(LLMCall).filter(LLMCall.session_id == session_id).count()
