import re


class TextChunker:
    _SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
        clean_text = self._normalize_text(text)
        if not clean_text:
            return []
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero")
        if overlap < 0 or overlap >= chunk_size:
            raise ValueError("overlap must be non-negative and smaller than chunk_size")

        paragraphs = [para.strip() for para in re.split(r"\n{2,}", clean_text) if para.strip()]
        if not paragraphs:
            paragraphs = [clean_text]

        chunks: list[str] = []
        current_parts: list[str] = []
        current_length = 0

        for paragraph in paragraphs:
            paragraph_parts = self._split_large_paragraph(paragraph, chunk_size)
            for part in paragraph_parts:
                part_length = len(part)
                if current_parts and current_length + part_length + 2 > chunk_size:
                    chunk = "\n\n".join(current_parts).strip()
                    if chunk:
                        chunks.append(chunk)
                    current_parts = self._build_overlap_parts(current_parts, overlap)
                    current_length = len("\n\n".join(current_parts))

                current_parts.append(part)
                current_length += part_length + 2

        if current_parts:
            chunk = "\n\n".join(current_parts).strip()
            if chunk:
                chunks.append(chunk)

        return chunks

    def _normalize_text(self, text: str) -> str:
        text = re.sub(r"\f", "\n", text)
        text = re.sub(r"-\s*\n\s*(\w)", r"\1", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def _split_large_paragraph(self, paragraph: str, chunk_size: int) -> list[str]:
        if len(paragraph) <= chunk_size:
            return [paragraph]

        sentences = [sentence.strip() for sentence in self._SENTENCE_SPLIT.split(paragraph) if sentence.strip()]
        if not sentences:
            return [paragraph[i : i + chunk_size] for i in range(0, len(paragraph), chunk_size)]

        parts: list[str] = []
        current_sentences: list[str] = []
        current_length = 0

        for sentence in sentences:
            sentence_length = len(sentence)
            if current_sentences and current_length + sentence_length + 1 > chunk_size:
                parts.append(" ".join(current_sentences).strip())
                current_sentences = []
                current_length = 0
            current_sentences.append(sentence)
            current_length += sentence_length + 1

        if current_sentences:
            parts.append(" ".join(current_sentences).strip())

        return parts

    def _build_overlap_parts(self, parts: list[str], overlap: int) -> list[str]:
        if overlap <= 0 or not parts:
            return []

        carry: list[str] = []
        total = 0
        for part in reversed(parts):
            carry.insert(0, part)
            total += len(part)
            if total >= overlap:
                break
        return carry
