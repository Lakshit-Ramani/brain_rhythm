from backend.database.db import db

class SectionTime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    section = db.Column(db.String(100), nullable=False)
    time_spent = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return f'<SectionTime {self.session_id}:{self.section} {self.time_spent}s>'

