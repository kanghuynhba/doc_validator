import re
from collections import OrderedDict

from app.services.llm_client import LLMClient
from app.services.prompt_loader import load_prompt


class Summarizer:
    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client or LLMClient()
        self.chunk_prompt_template = load_prompt("summarizer_chunk.txt")
        self.reduce_prompt_template = load_prompt("summarizer_reduce.txt")

    def summarize_chunks(self, chunks: list[str]) -> list[str]:
        summaries: list[str] = []
        for chunk in chunks:
            prompt = self.chunk_prompt_template.replace("{{content}}", chunk)
            summaries.append(self.llm_client.complete(prompt, max_tokens=700))
        return summaries

    def reduce_summaries(self, chunk_summaries: list[str]) -> str:
        unique_summaries = self._dedupe_key_ideas(chunk_summaries)
        prompt = self.reduce_prompt_template.replace("{{content}}", "\n\n".join(unique_summaries))
        return self.llm_client.complete(prompt, max_tokens=1600)

    def chunk_document(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
        clean_text = self._normalize_text(text)
        if not clean_text:
            return []
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero")
        if overlap < 0 or overlap >= chunk_size:
            raise ValueError("overlap must be non-negative and smaller than chunk_size")

        sections = self._build_sections(clean_text)
        chunks: list[str] = []
        for title, paragraphs in sections:
            chunks.extend(self._chunk_section(title, paragraphs, chunk_size, overlap))
        return chunks

    def summarize_document(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> str:
        chunks = self.chunk_document(text, chunk_size=chunk_size, overlap=overlap)
        if not chunks:
            return ""
        chunk_summaries = self.summarize_chunks(chunks)
        return self.reduce_summaries(chunk_summaries)

    def _normalize_text(self, text: str) -> str:
        return "\n".join(line.rstrip() for line in text.splitlines()).strip()

    def _build_sections(self, text: str) -> list[tuple[str, list[str]]]:
        paragraphs = self._split_into_blocks(text)
        sections: list[tuple[str, list[str]]] = []
        current_title = "Document overview"
        current_blocks: list[str] = []

        for block in paragraphs:
            if self._looks_like_heading(block):
                if current_blocks:
                    sections.append((current_title, current_blocks))
                    current_blocks = []
                current_title = self._clean_heading(block)
                continue
            current_blocks.append(block)

        if current_blocks or not sections:
            sections.append((current_title, current_blocks))

        return sections

    def _split_into_blocks(self, text: str) -> list[str]:
        blocks: list[str] = []
        buffer: list[str] = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                if buffer:
                    blocks.append(" ".join(buffer).strip())
                    buffer = []
                continue

            if self._looks_like_heading(line) or self._looks_like_list_item(line):
                if buffer:
                    blocks.append(" ".join(buffer).strip())
                    buffer = []
                blocks.append(line)
                continue

            buffer.append(line)

        if buffer:
            blocks.append(" ".join(buffer).strip())
        return [block for block in blocks if block]

    def _chunk_section(self, title: str, paragraphs: list[str], chunk_size: int, overlap: int) -> list[str]:
        if not paragraphs:
            return [f"Section: {title}"]

        prefix = f"Section: {title}\n"
        chunks: list[str] = []
        current: list[str] = []
        current_length = len(prefix)

        for paragraph in paragraphs:
            addition = len(paragraph) + 2
            if current and current_length + addition > chunk_size:
                chunks.append(self._format_section_chunk(title, current))
                current = self._build_overlap(current, overlap)
                current_length = len(prefix) + sum(len(item) + 2 for item in current)
            current.append(paragraph)
            current_length += addition

        if current:
            chunks.append(self._format_section_chunk(title, current))
        return chunks

    def _format_section_chunk(self, title: str, paragraphs: list[str]) -> str:
        body = "\n\n".join(paragraphs).strip()
        return f"Section: {title}\n\n{body}".strip()

    def _build_overlap(self, paragraphs: list[str], overlap: int) -> list[str]:
        if overlap <= 0 or not paragraphs:
            return []

        carry: list[str] = []
        total = 0
        for paragraph in reversed(paragraphs):
            carry.insert(0, paragraph)
            total += len(paragraph)
            if total >= overlap:
                break
        return carry

    def _looks_like_heading(self, line: str) -> bool:
        stripped = line.strip()
        if len(stripped) > 120 or len(stripped.split()) > 12:
            return False
        if stripped.endswith(":"):
            return True
        if re.match(r"^(chapter|section|part)\s+\d+", stripped, flags=re.IGNORECASE):
            return True
        if re.match(r"^\d+(\.\d+)*[\).\:-]?\s+\S+", stripped):
            return True

        words = stripped.split()
        if len(words) <= 6 and stripped == stripped.upper() and any(char.isalpha() for char in stripped):
            return True

        title_case_words = sum(1 for word in words if word[:1].isupper())
        if len(words) <= 8 and title_case_words >= max(1, len(words) - 1) and not stripped.endswith("."):
            return True

        return False

    def _clean_heading(self, line: str) -> str:
        cleaned = re.sub(r"^\d+(\.\d+)*[\).\:-]?\s*", "", line.strip())
        cleaned = cleaned.rstrip(":")
        return cleaned or "Untitled section"

    def _looks_like_list_item(self, line: str) -> bool:
        return bool(re.match(r"^(\-|\*|•|\d+[\).\:-])\s+\S+", line.strip()))

    def _dedupe_key_ideas(self, chunk_summaries: list[str]) -> list[str]:
        seen: OrderedDict[str, None] = OrderedDict()
        deduped_blocks: list[str] = []

        for summary in chunk_summaries:
            lines = [line.strip() for line in summary.splitlines() if line.strip()]
            block_lines: list[str] = []
            for line in lines:
                if self._is_key_idea_line(line):
                    normalized = self._normalize_key_idea(line)
                    if normalized in seen:
                        continue
                    seen[normalized] = None
                block_lines.append(line)
            if block_lines:
                deduped_blocks.append("\n".join(block_lines))
        return deduped_blocks

    def _is_key_idea_line(self, line: str) -> bool:
        stripped = line.lstrip()
        return stripped.startswith("- ") or stripped.startswith("• ") or bool(re.match(r"^\d+[\).\:-]\s+", stripped))

    def _normalize_key_idea(self, line: str) -> str:
        normalized = re.sub(r"^[\-\*•\d\.\)\:\-]+\s*", "", line.strip().lower())
        normalized = re.sub(r"[^a-z0-9\s]", "", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized
