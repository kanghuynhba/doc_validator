from app.services.llm_client import LLMClient
from app.services.prompt_loader import load_prompt
from app.services.text_chunker import TextChunker


class Summarizer:
    def __init__(
        self,
        llm_client: LLMClient | None = None,
        text_chunker: TextChunker | None = None,
    ) -> None:
        self.llm_client = llm_client or LLMClient()
        self.text_chunker = text_chunker or TextChunker()
        self.chunk_prompt_template = load_prompt("summarizer_chunk.txt")
        self.reduce_prompt_template = load_prompt("summarizer_reduce.txt")

    def chunk_document(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
        return self.text_chunker.chunk_text(text, chunk_size=chunk_size, overlap=overlap)

    def summarize_chunks(self, chunks: list[str]) -> list[str]:
        summaries: list[str] = []
        for chunk in chunks:
            prompt = self.chunk_prompt_template.replace("{{content}}", chunk)
            summaries.append(self._clean_output(self.llm_client.complete(prompt, max_tokens=700)))
        return summaries

    def reduce_summaries(self, chunk_summaries: list[str]) -> str:
        filtered = [summary.strip() for summary in chunk_summaries if summary.strip()]
        if not filtered:
            return ""
        prompt = self.reduce_prompt_template.replace("{{content}}", "\n\n".join(filtered))
        return self._clean_output(self.llm_client.complete(prompt, max_tokens=1200))

    def summarize_document(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> str:
        chunks = self.chunk_document(text, chunk_size=chunk_size, overlap=overlap)
        if not chunks:
            return ""
        chunk_summaries = self.summarize_chunks(chunks)
        return self.reduce_summaries(chunk_summaries)

    def _clean_output(self, text: str) -> str:
        cleaned = text.strip()
        cleaned = cleaned.replace("●", "\n- ")
        cleaned = cleaned.replace("•", "\n- ")
        cleaned = cleaned.replace("  ", " ")
        lines = [line.rstrip() for line in cleaned.splitlines()]
        normalized_lines: list[str] = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                if normalized_lines and normalized_lines[-1] != "":
                    normalized_lines.append("")
                continue
            if stripped.startswith("-") and len(stripped) > 1:
                normalized_lines.append(f"- {stripped.lstrip('- ').strip()}")
            else:
                normalized_lines.append(stripped)
        return "\n".join(normalized_lines).strip()
