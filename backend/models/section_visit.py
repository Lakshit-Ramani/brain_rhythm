from backend.database.db import db
from datetime import datetime

class SectionVisit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    section = db.Column(db.String(100), unique=True, nullable=False)
    total_visits = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<SectionVisit {self.section}: {self.total_visits}>'

    @classmethod
    def increment_visit(cls, section):
        visit = cls.query.filter_by(section=section).first()
        if visit:
            visit.total_visits += 1
        else:
            visit = cls(section=section, total_visits=1)
            db.session.add(visit)
        db.session.commit()

