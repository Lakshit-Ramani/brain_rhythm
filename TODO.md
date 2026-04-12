# Analytics System Implementation TODO

## Status: In Progress

### 1. Create backend structure [ ]
- backend/database/__init__.py
- backend/database/db.py
- backend/models/__init__.py
- backend/models/section_visit.py
- backend/models/user_session.py
- backend/models/section_time.py
- backend/routes/__init__.py
- backend/routes/analytics_routes.py

### 2. Create frontend files [ ]
- static/js/analytics.js
- templates/dashboard.html

### 3. Update dependencies [ ]
- Edit requirements.txt: add Flask-SQLAlchemy

### 4. Edit core files [ ]
- app.py: add imports, config, init, blueprint, dashboard route
- templates/base.html: add <script src=analytics.js>

### 5. Install deps and test [ ]
- pip install -r requirements.txt
- Restart server
- Visit /dashboard
- Test tracking by navigating

Updated when steps complete.

