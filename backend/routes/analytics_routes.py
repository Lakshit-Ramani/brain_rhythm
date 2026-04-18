import csv
import io
import requests
from flask import Blueprint, request, jsonify
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/analytics-data', methods=['GET'])
def analytics_data():
    daily = []
    country = []
    
    try:
        print("Fetching daily CSV...")
        daily_resp = requests.get('https://data.neuroresonance.co.in/daily_traffic.csv', timeout=15)
        print(f"Daily status: {daily_resp.status_code}")
        if daily_resp.status_code == 200:
            csv_text = daily_resp.text.strip()
            print("Daily CSV preview:", csv_text[:100])
            reader = csv.DictReader(io.StringIO(csv_text))
            daily = [dict(row) for row in reader]
        else:
            print(f"Daily CSV failed: {daily_resp.status_code}")
    except Exception as e:
        print(f"Daily CSV ERROR: {e}")
    
    try:
        print("Fetching country CSV...")
        country_resp = requests.get('https://data.neuroresonance.co.in/traffic_by_country.csv', timeout=15)
        print(f"Country status: {country_resp.status_code}")
        if country_resp.status_code == 200:
            csv_text = country_resp.text.strip()
            print("Country CSV preview:", csv_text[:100])
            reader = csv.DictReader(io.StringIO(csv_text))
            country = [dict(row) for row in reader]
        else:
            print(f"Country CSV failed: {country_resp.status_code}")
    except Exception as e:
        print(f"Country CSV ERROR: {e}")
    
    response = {
        'daily': daily,
        'country': country
    }
    
    print(f"Returning {len(daily)} daily rows, {len(country)} country rows")
    return jsonify(response)

@analytics_bp.route('/track-visit', methods=['POST'])
def track_visit():
    return jsonify({'status': 'success'})

@analytics_bp.route('/track-time', methods=['POST'])
def track_time():
    return jsonify({'status': 'success'})


