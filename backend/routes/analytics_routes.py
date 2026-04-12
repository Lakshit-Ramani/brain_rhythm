from flask import Blueprint, request, jsonify
from backend.database.db import db
from backend.models.section_visit import SectionVisit
from backend.models.user_session import UserSession
from backend.models.section_time import SectionTime
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/track-visit', methods=['POST'])
def track_visit():
    data = request.get_json(force=True)
    print(f"Raw data received: {data}")
    section = data.get('section')
    session_id = data.get('session_id')
    print(f"TRACK VISIT CALLED - section: {section}, session_id: {session_id}")

    
    if not section or not session_id:
        return jsonify({'error': 'Missing section or session_id'}), 400
    
    # Create or get user session
    UserSession.get_or_create(session_id)
    
    # Increment visit
    SectionVisit.increment_visit(section)
    
    return jsonify({'status': 'success'})

@analytics_bp.route('/track-time', methods=['POST'])
def track_time():
    data = request.get_json(force=True)
    print(f"Raw time data: {data}")
    section = data.get('section')
    session_id = data.get('session_id')
    time_spent = data.get('time_spent', 0.0)
    print(f"TRACK TIME CALLED - section: {section}, session_id: {session_id}, time: {time_spent}")
    
    if not section or not session_id or time_spent is None:
        return jsonify({'error': 'Missing data'}), 400
    
    time_record = SectionTime(session_id=session_id, section=section, time_spent=float(time_spent))
    db.session.add(time_record)
    db.session.commit()
    
    return jsonify({'status': 'success'})

@analytics_bp.route('/analytics-data', methods=['GET'])
def analytics_data():
    # Visits
    visits = dict(SectionVisit.query.with_entities(SectionVisit.section, SectionVisit.total_visits).all())
    
    # Time spent per section
    time_query = db.session.query(
        SectionTime.section, 
        db.func.sum(SectionTime.time_spent).label('total_time')
    ).group_by(SectionTime.section).all()
    time_spent = dict(time_query)
    
    # Unique users
    unique_users = UserSession.query.count()
    
    return jsonify({
        'visits': visits,
        'time_spent': time_spent,
        'unique_users': unique_users
    })

