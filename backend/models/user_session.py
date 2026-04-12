from backend.database.db import db
from datetime import datetime

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<UserSession {self.session_id}>'

    @classmethod
    def get_or_create(cls, session_id):
        session = cls.query.filter_by(session_id=session_id).first()
        if not session:
            session = cls(session_id=session_id)
            db.session.add(session)
            db.session.commit()
        return session

