from app.services.llm_client import LLMClient


class Summarizer:
    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client or LLMClient()

    def summarize_chunks(self, chunks: list[str]) -> list[str]:
        summaries = []
        for chunk in chunks:
            prompt = (
                "Summarize this PDF chunk into concise study notes. "
                "Keep key facts, definitions, and relationships.\n\nCONTENT:\n"
                f"{chunk}"
            )
            summaries.append(self.llm_client.complete(prompt))
        return summaries

    def reduce_summaries(self, chunk_summaries: list[str]) -> str:
        prompt = (
            "Combine these chunk summaries into one coherent study summary. "
            "Remove repetition and preserve the main learning points.\n\nCONTENT:\n"
            f"{chr(10).join(chunk_summaries)}"
        )
        return self.llm_client.complete(prompt, max_tokens=1600)

    def summarize_document(self, chunks: list[str]) -> str:
        if not chunks:
            return ""
        chunk_summaries = self.summarize_chunks(chunks)
        return self.reduce_summaries(chunk_summaries)
