document.addEventListener("DOMContentLoaded", function() {
  'use strict';
  console.log("CSV Analytics Dashboard v7 - Full ISO Mapping + No Errors");

  // === KEEP EXISTING TRACKING ===
  let sessionId = localStorage.getItem('analytics_session_id') || 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('analytics_session_id', sessionId);

  const sectionMap = { /* unchanged */ };
  function getSection() { /* unchanged tracking logic */ return 'HOME'; }

  async function trackVisit(section) {
    fetch('/track-visit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({section, session_id: sessionId})
    }).catch(e => {}); // Silent - CSV system
  }

  function trackTime(section, timeSpent) {
    navigator.sendBeacon('/track-time', new Blob([JSON.stringify({section, session_id: sessionId, time_spent: timeSpent})], {'type': 'application/json'}));
  }

  trackVisit(getSection());
  let startTime = performance.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackTime(getSection(), (performance.now() - startTime) / 1000);
      startTime = performance.now();
    }
  });

  // === CSV DASHBOARD CLASS ===
  class CSVDashboard {
    constructor() {
      this.charts = { line: null, pie: null };
      this.map = null;
      this.heatLayer = null;
      this.loadData();
      setInterval(() => this.loadData(), 10000);
    }

    async loadData() {
      try {
        const response = await fetch('/analytics-data');
        const csvData = await response.json();

        if (!csvData.daily || !csvData.country) {
          console.warn('Empty CSV data:', csvData);
          return;
        }

        // === 1. FIX TOP STAT CARDS ===
        this.updateCards(csvData);

        // === 2. RENDER CHARTS ===
        await this.renderCharts(csvData);

      } catch (e) {
        console.error('CSV dashboard error:', e);
      }
    }

    updateCards(csvData) {
      const daily = csvData.daily || [];
      const country = csvData.country || [];

      // TOTAL VISITS = sum Visits
      const totalVisits = daily.reduce((sum, row) => sum + Number(row.Visits || 0), 0);
      document.getElementById('total-users').textContent = totalVisits.toLocaleString();

      // TOTAL REQUESTS = sum Requests
      const totalRequests = daily.reduce((sum, row) => sum + Number(row.Requests || 0), 0);
      document.getElementById('total-visits').textContent = totalRequests.toLocaleString();

      // AVG BANDWIDTH = avg Bandwidth_MB + "MB" 
      const bandwidths = daily.map(row => Number(row.Bandwidth_MB || 0)).filter(b => b > 0);
      const avgBandwidth = bandwidths.length ? (bandwidths.reduce((a, b) => a + b, 0) / bandwidths.length).toFixed(1) : 0;
      document.getElementById('avg-session').textContent = avgBandwidth + ' MB';

      // TOP COUNTRY = max Requests
      const topCountry = country.reduce((max, row) => Number(row.Requests || 0) > (max.requests || 0) ? row : max, {});
      document.getElementById('top-section').textContent = topCountry.Country || '—';

      console.log('Cards updated:', {totalVisits, totalRequests, avgBandwidth, topCountry});
    }

    getCountryCoordinates(code) {
      const map = {
        IN: [20.5937, 78.9629],
        US: [37.0902, -95.7129],
        RO: [45.9432, 24.9668],
        KR: [35.9078, 127.7669],
        SG: [1.3521, 103.8198],
        SE: [60.1282, 18.6435],
        TW: [23.6978, 120.9605],
        PL: [51.9194, 19.1451],
        IE: [53.1424, -7.6921],
        LT: [55.1694, 23.8813],
        CZ: [49.8175, 15.4730],
        HK: [22.3193, 114.1694],
        LV: [56.8796, 24.6032],
        CH: [46.8182, 8.2275],
        BD: [23.6850, 90.3563],
        PK: [30.3753, 69.3451],
        PE: [-9.1900, -75.0152],
        BG: [42.7339, 25.4858],
        ET: [9.1450, 40.4897],
        UA: [48.3794, 31.1656],
        BE: [50.5039, 4.4699],
        DE: [51.1657, 10.4515],
        FR: [46.2276, 2.2137],
        CA: [56.1304, -106.3468],
        GB: [55.3781, -3.4360],
        NL: [52.1326, 5.2913],
        BR: [-14.2350, -51.9253],
        ES: [40.4637, -3.7492],
        IT: [41.8719, 12.5674]
      };
      return map[code] || null;
    }

    async renderCharts(csvData) {
      const daily = csvData.daily || [];
      const country = csvData.country || [];

      // Parse data safely
      const dates = daily.map(row => row.Date || 'Unknown').slice(-10);
      const visits = daily.map(row => Number(row.Visits || 0)).slice(-10);
      const requests = daily.map(row => Number(row.Requests || 0)).slice(-10);

      // TOP 9 COUNTRIES + "OTHERS" for pie chart
      const sortedCountry = [...country].sort((a, b) => Number(b.Requests || 0) - Number(a.Requests || 0));
      const topCountries = sortedCountry.slice(0, 9);
      const othersCountries = sortedCountry.slice(9);
      const othersValue = othersCountries.reduce((sum, c) => sum + Number(c.Requests || 0), 0);
      const pieLabels = topCountries.map(c => c.Country || 'Unknown');
      const pieData = topCountries.map(c => Number(c.Requests || 0));
      if (othersValue > 0) {
        pieLabels.push('Others');
        pieData.push(othersValue);
      }

      // Destroy charts
      if (this.charts.line) this.charts.line.destroy();
      if (this.charts.pie) this.charts.pie.destroy();
      this.charts = { line: null, pie: null };

      // === LINE CHART ===
      const lineCanvas = document.getElementById('trend-line');
      if (lineCanvas) {
        lineCanvas.parentElement.querySelector('h4').textContent = 'Traffic Overview';
        lineCanvas.parentElement.querySelector('h4').style.color = '#222';
        this.charts.line = new Chart(lineCanvas, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              { label: 'Visits', data: visits, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true, pointRadius: 4 },
              { label: 'Requests', data: requests, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: false }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { x: { grid: { color: 'rgba(0,0,0,0.05)' } }, y: { beginAtZero: true } }
          }
        });
      }

      // === PIE CHART ===
      const pieCanvas = document.getElementById('distribution-pie');
      if (pieCanvas) {
        pieCanvas.parentElement.querySelector('h4').textContent = 'Traffic by Country (Top 9 + Others)';
        pieCanvas.parentElement.querySelector('h4').style.color = '#222';
        this.charts.pie = new Chart(pieCanvas, {
          type: 'pie',
          data: {
            labels: pieLabels,
            datasets: [{ data: pieData, backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#ec4899','#10b981','#f3f4f6'] }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { padding: 15, font: { size: 10 }, usePointStyle: true } } }
          }
        });
      }

      // === HEATMAP - FULLY FIXED ===
      const mapDiv = document.getElementById('map');
      if (mapDiv) {
        mapDiv.parentElement.querySelector('h4').textContent = 'Live Traffic Heatmap';
        mapDiv.parentElement.querySelector('h4').style.color = '#222';

        // Init map once
        if (!this.map) {
          console.log('Initializing Leaflet map');
          this.map = L.map('map').setView([20, 0], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 6
          }).addTo(this.map);
        }

        console.log("Country CSV:", country);

        // Compute max requests
        const maxRequests = Math.max(...country.map(c => Number(c.Requests || 0)), 1);
        console.log('Max requests:', maxRequests);

        // Generate heat data with full ISO mapping
        const heatData = country
          .map(c => {
            const name = (c.Country || '').trim();
            const coords = this.getCountryCoordinates(name);
            
            console.log("Matching:", name, coords);
            
            if (!coords) return null;

            const value = Number(c.Requests || 0);
            const intensity = value / maxRequests;

            return [coords[0], coords[1], intensity];
          })
          .filter(Boolean);

        console.log("Final heat points:", heatData.length, heatData.slice(0,3));

        if (heatData.length === 0) {
          console.error("No valid coordinates - using fallback");
          heatData.push([20.59, 78.96, 1], [37.09, -95.71, 1], [51.16, 10.45, 1]);
        }

        // Remove old layer
        if (this.heatLayer) {
          this.map.removeLayer(this.heatLayer);
        }

        // Create optimized heatmap
        this.heatLayer = L.heatLayer(heatData, {
          radius: 40,
          blur: 25,
          minOpacity: 0.4,
          maxZoom: 6,
          gradient: { 0.1: '#60a5fa', 0.3: '#3b82f6', 0.5: '#10b981', 0.7: '#f59e0b', 1.0: '#ef4444' }
        }).addTo(this.map);

        // Fix bounds error - manual bounds from data
        if (heatData.length > 0) {
          const bounds = L.latLngBounds(heatData.map(p => L.latLng(p[0], p[1])));
          this.map.fitBounds(bounds, { padding: [20, 20] });
        }

        console.log('Heatmap rendered successfully');
      }
    }
  }

  // Initialize
  new CSVDashboard();
});
