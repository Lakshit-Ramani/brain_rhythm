document.addEventListener("DOMContentLoaded", function() {
    'use strict';
    console.log("Analytics JS DOM ready");

    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('analytics_session_id', sessionId);
    }
    console.log("Session ID:", sessionId);

    const sectionMap = {
        '/': 'HOME',
        '/neural-clocks': 'NEURAL CLOCKS',
        '/brain-components': 'BRAIN COMPONENTS',
        '/human-study': 'HUMAN SUBJECT STUDY',
        '/quantum-computer': 'OPTICAL VORTICES BASED QUANTUM COMPUTER',
        '/medical/cancer': 'MEDICAL APPLICATION',
        '/medical/schizophrenia': 'MEDICAL APPLICATION',
        '/medical/alzheimers': 'MEDICAL APPLICATION',
        '/medical/thrombosis': 'MEDICAL APPLICATION',
        '/proteins': 'PROTEIN',
        '/proteins/circuit': 'PROTEIN',
        '/conference/matrisneha': 'CONFERENCE',
        '/conference/garima': 'CONFERENCE',
        '/conference/surobane': 'CONFERENCE',
        '/about': 'ABOUT',
        '/about-us': 'ABOUT US'
    };

    function getSection() {
        const path = window.location.pathname;
        console.log("Path:", path);
        
        if (path.startsWith('/brain-components/')) return 'BRAIN COMPONENTS';
        if (path.startsWith('/proteins/')) return 'PROTEIN';
        if (path.startsWith('/medical/')) return 'MEDICAL APPLICATION';
        if (path.startsWith('/conference/')) return 'CONFERENCE';
        if (path.startsWith('/brain-components/eeg-ddg/')) return 'EEG DDG';
        
        const section = sectionMap[path] || path.substring(1).replace(/-/g, ' ').toUpperCase();
        console.log("Section:", section);
        return section;
    }

    async function trackVisit(section) {
        console.log("trackVisit called for:", section);
        try {
            const response = await fetch('/track-visit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({section, session_id: sessionId})
            });
            console.log("Track visit response:", response.status);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (e) {
            console.error('Track visit error:', e);
        }
    }

    function trackTime(section, timeSpent) {
        console.log("trackTime:", section, timeSpent);
        const data = {section, session_id: sessionId, time_spent: timeSpent};
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
            navigator.sendBeacon('/track-time', blob);
        } else {
            fetch('/track-time', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            }).catch(e => console.log('Track time fallback error:', e));
        }
    }

    // Track on load
    trackVisit(getSection());

    // Time tracking
    let startTime = performance.now();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            const timeSpent = (performance.now() - startTime) / 1000;
            trackTime(getSection(), timeSpent);
            startTime = performance.now();
        } else {
            startTime = performance.now();
        }
    });

    window.addEventListener('pagehide', () => {
        const timeSpent = (performance.now() - startTime) / 1000;
        trackTime(getSection(), timeSpent);
    });

    // Nav clicks
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', () => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                const url = new URL(href.startsWith('http') ? href : window.location.origin + href, window.location);
                const futureSection = getSectionForPath(url.pathname);
                console.log('Nav to', futureSection);
            }
        });
    });
});

function getSectionForPath(path) {
    // Same as getSection but for future paths
    const sectionMap = { /* same map */ };
    // ... logic
    return 'FUTURE_SECTION';
}

