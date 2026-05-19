"""Shared text-processing utilities used across services."""

from __future__ import annotations

import re
from typing import Iterable


def deduplicate_lines(lines: Iterable[str], *, max_lines: int | None = None) -> list[str]:
    """Remove duplicate content from a sequence of lines (case-insensitive).

    Bullets, numbered items, and plain text are all handled.  Lines are
    compared after stripping markers and normalising whitespace.
    """
    seen: set[str] = set()
    result: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Normalise for deduplication: remove leading markers and punctuation
        # then collapse whitespace.
        normalized = re.sub(r"^[\-\*\u2022\u2043\u2219]\s*", "", stripped)
        normalized = re.sub(r"\d+[\.\)\:\-]+\s*", "", normalized)
        normalized = re.sub(r"[^a-z0-9\s]", "", normalized.lower())
        normalized = re.sub(r"\s+", " ", normalized).strip()

        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        result.append(stripped)

        if max_lines is not None and len(result) >= max_lines:
            break

    return result


def normalize_output(text: str) -> str:
    """Apply consistent formatting rules to LLM output.

    - Replaces Unicode bullet characters with markdown dash bullets.
    - Collapses multiple spaces.
    - Removes trailing whitespace per line.
    - Collapses consecutive blank lines.
    - Re-wraps bullet lines into ``- item`` form.
    """
    cleaned = text.strip()
    cleaned = cleaned.replace("\u2022", "\n- ")
    cleaned = cleaned.replace("\u2219", "\n- ")
    cleaned = cleaned.replace("●", "\n- ")
    cleaned = cleaned.replace("•", "\n- ")
    cleaned = cleaned.replace("  ", " ")

    lines = [line.rstrip() for line in cleaned.splitlines()]
    result: list[str] = []
    prev_blank = False

    for line in lines:
        stripped = line.strip()

        # Collapse multiple blank lines.
        if not stripped:
            if prev_blank:
                continue
            prev_blank = True
            result.append("")
            continue
        prev_blank = False

        # Re-wrap bullet-like lines into markdown form.
        if stripped.startswith("-") and len(stripped) > 1:
            result.append(f"- {stripped.lstrip('- ').strip()}")
        else:
            result.append(stripped)

    return "\n".join(result).strip()
