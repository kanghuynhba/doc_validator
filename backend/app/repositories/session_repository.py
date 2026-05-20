from app.models.session import Session


class SessionRepository:
    def __init__(self, db) -> None:
        self._db = db

    def create(self, filename: str, document_length: int, num_chunks: int) -> Session:
        session = Session(
            filename=filename,
            document_length=document_length,
            num_chunks=num_chunks,
            status="processing",
        )
        self._db.add(session)
        self._db.flush()
        return session

    def get(self, session_id: str) -> Session | None:
        return self._db.query(Session).filter(Session.id == session_id).first()

    def update_status(self, session_id: str, status: str) -> None:
        self._db.query(Session).filter(Session.id == session_id).update({"status": status})
        self._db.flush()
