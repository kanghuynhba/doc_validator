class TextChunker:
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
        clean_text = " ".join(text.split())
        if not clean_text:
            return []
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero")
        if overlap < 0 or overlap >= chunk_size:
            raise ValueError("overlap must be non-negative and smaller than chunk_size")

        chunks: list[str] = []
        start = 0
        while start < len(clean_text):
            end = min(start + chunk_size, len(clean_text))
            chunks.append(clean_text[start:end])
            if end == len(clean_text):
                break
            start = end - overlap
        return chunks
