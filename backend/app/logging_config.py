"""Centralised structured-logging configuration.

All modules import `log` from here so log verbosity is configured in one
place.  Log records include contextual fields such as ``session_id``,
``chunk_index`` and ``llm_model`` without any extra boilerplate.
"""

from __future__ import annotations

import logging
import sys
from typing import Any


# -------------------------------------------------------------------------- #
# Log-level convenience helpers used by the rest of the codebase
# -------------------------------------------------------------------------- #
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


# -------------------------------------------------------------------------- #
# Setup — called once at application startup
# -------------------------------------------------------------------------- #
def configure_logging(*, level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    fmt = "%(asctime)s %(levelname)-8s %(name)-30s %(message)s"
    handler.setFormatter(logging.Formatter(fmt, datefmt="%H:%M:%S"))

    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)

    # Quiet noisy third-party loggers
    for noisy in ("uvicorn.access", "uvicorn.asgi", "httpx", "openapi"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


# -------------------------------------------------------------------------- #
# Prompt / response tracing helpers
# -------------------------------------------------------------------------- #
def log_prompt(logger: logging.Logger, chunk_index: int | None, prompt: str, max_chars: int = 500) -> None:
    truncated = prompt[:max_chars] + ("..." if len(prompt) > max_chars else "")
    extra: dict[str, Any] = {"event": "prompt_sent", "chunk_index": chunk_index, "prompt_len": len(prompt)}
    logger.info("→ LLM request  chunk=%s  len=%d\n%s", chunk_index, len(prompt), truncated, extra=extra)


def log_response(
    logger: logging.Logger, chunk_index: int | None, response: str, elapsed_s: float, max_chars: int = 500
) -> None:
    truncated = response[:max_chars] + ("..." if len(response) > max_chars else "")
    extra: dict[str, Any] = {
        "event": "response_received",
        "chunk_index": chunk_index,
        "response_len": len(response),
        "elapsed_s": round(elapsed_s, 2),
    }
    logger.info("← LLM response  chunk=%s  took=%.2fs  len=%d\n%s", chunk_index, elapsed_s, len(response), truncated, extra=extra)


def log_chunk_progress(
    logger: logging.Logger, current: int, total: int, chunk_index: int | None = None
) -> None:
    extra: dict[str, Any] = {
        "event": "chunk_progress",
        "current": current,
        "total": total,
        "pct": round(current / total * 100, 1) if total else 0,
    }
    logger.info("  Chunk %d/%d", current, total, extra=extra)


def log_pipeline_stage(logger: logging.Logger, stage: str, **kwargs: Any) -> None:
    extra: dict[str, Any] = {"event": "pipeline_stage", "stage": stage, **kwargs}
    logger.info("▶ Stage: %s  filename=%s", stage, extra.get("file_name", ""), extra=extra)
