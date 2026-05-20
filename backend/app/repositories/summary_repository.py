from app.models.summary import Summary


class SummaryRepository:
    def __init__(self, db) -> None:
        self._db = db

    def create(self, session_id: str, summary_text: str, word_count: int) -> Summary:
        summary = Summary(session_id=session_id, summary_text=summary_text, word_count=word_count)
        self._db.add(summary)
        self._db.flush()
        return summary

    def get_by_session(self, session_id: str) -> Summary | None:
        return self._db.query(Summary).filter(Summary.session_id == session_id).first()

    def upsert(self, session_id: str, summary_text: str, word_count: int) -> Summary:
        existing = self.get_by_session(session_id)
        if existing:
            existing.summary_text = summary_text
            existing.word_count = word_count
            self._db.flush()
            return existing
        return self.create(session_id, summary_text, word_count)
