import { initializeApp }                  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── FIREBASE CONFIG ───────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyB1J80tGuYbT_M2FPK8vDArtjDWv2M_P48",
  authDomain:        "in-and-out-monitoring.firebaseapp.com",
  databaseURL:       "https://in-and-out-monitoring-default-rtdb.firebaseio.com",
  projectId:         "in-and-out-monitoring",
  storageBucket:     "in-and-out-monitoring.firebasestorage.app",
  messagingSenderId: "1045074950770",
  appId:             "1:1045074950770:web:db213db6f32e45eb67e0eb"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── HELPERS ───────────────────────────────
function todayKey() {
  const d = new Date();
  return d.getFullYear()
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0');
}

function animNum(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.textContent !== String(val)) {
    el.textContent = val;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }
}

function setOnline(ok) {
  document.getElementById('sdot').className  = 'sdot ' + (ok ? 'on' : 'off');
  document.getElementById('stxt').textContent = ok ? 'LIVE' : 'OFFLINE';
}

// ── CHART ────────────────────────────────
let chart = null;

function initChart() {
  const ctx = document.getElementById('hChart').getContext('2d');
  const labels = Array.from({ length: 24 }, (_, i) => {
    const h = i % 12 || 12;
    return i < 12 ? `${h}am` : `${h}pm`;
  });

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'In',
          data: new Array(24).fill(0),
          backgroundColor: 'rgba(52,211,153,.5)',
          borderColor: 'rgba(52,211,153,.85)',
          borderWidth: 1, borderRadius: 3
        },
        {
          label: 'Out',
          data: new Array(24).fill(0),
          backgroundColor: 'rgba(251,113,133,.45)',
          borderColor: 'rgba(251,113,133,.8)',
          borderWidth: 1, borderRadius: 3
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#4a5a70', font: { size: 9, family: 'DM Mono' }, maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,.03)' } },
        y: { ticks: { color: '#4a5a70', font: { size: 10, family: 'DM Mono' } }, grid: { color: 'rgba(255,255,255,.03)' }, beginAtZero: true }
      }
    }
  });
}

// ── RENDER LOG ────────────────────────────
function renderLog(events) {
  const el = document.getElementById('log-body');
  if (!events || !events.length) {
    el.innerHTML = '<div class="log-empty">No events yet today. Waiting for ESP32…</div>';
    return;
  }
  const icons  = { in: '↓', out: '↑', reset: '↺' };
  const labels = { in: 'Entry', out: 'Exit', reset: 'Reset' };
  el.innerHTML = events.map(e => `
    <div class="log-row ${e.type || 'in'}">
      <div class="log-ic">${icons[e.type] || '↓'}</div>
      <span class="log-ev">${labels[e.type] || 'Event'}</span>
      <span class="log-time">${e.time || '—'}</span>
      <span class="log-occ">${e.occupancy ?? '—'} inside</span>
    </div>`).join('');
}

// ── MAIN LISTENER ─────────────────────────
function listen() {
  const dbRef = ref(db, `malleye/counter/${todayKey()}`);

  onValue(dbRef, snap => {
    setOnline(true);
    document.getElementById('last-sync').textContent = 'Last sync: ' + new Date().toLocaleTimeString();

    const d = snap.val();
    if (!d) {
      document.getElementById('log-body').innerHTML =
        '<div class="log-empty">No data yet for today. Power on your ESP32…</div>';
      return;
    }

    const totalIn  = d.totalIn  || 0;
    const totalOut = d.totalOut || 0;
    const occ      = d.occupancy !== undefined ? d.occupancy : Math.max(0, totalIn - totalOut);
    const maxCap   = d.maxCapacity || 5000;
    const pct      = Math.min(100, Math.round(occ / maxCap * 100));

    // Numbers
    animNum('n-occ',  occ);
    animNum('n-in',   totalIn);
    animNum('n-out',  totalOut);
    animNum('n-peak', d.peakCount || 0);
    document.getElementById('n-peakt').textContent  = d.peakTime ? `at ${d.peakTime}` : '—';
    document.getElementById('n-upd').textContent    = d.lastUpdated || '—';
    document.getElementById('n-maxcap').textContent = maxCap.toLocaleString();
    document.getElementById('n-cap2').textContent   = maxCap.toLocaleString();
    document.getElementById('n-turn').textContent   = totalIn > 0 ? Math.round(totalOut / totalIn * 100) + '%' : '—';

    // Gauge
    const fill = document.getElementById('gfill');
    fill.style.width      = pct + '%';
    fill.style.background = pct >= 100 ? 'linear-gradient(90deg,#f87171,#ef4444)'
                          : pct >= 80  ? 'linear-gradient(90deg,#fbbf24,#f97316)'
                                       : 'linear-gradient(90deg,#34d399,#06b6d4)';
    document.getElementById('gpct').textContent = pct + '% of capacity';

    // Capacity badge
    const badge = document.getElementById('cap-badge');
    if (pct >= 100)     { badge.textContent = '● FULL';    badge.className = 'cap-badge full'; }
    else if (pct >= 80) { badge.textContent = '⚠ HIGH';   badge.className = 'cap-badge high'; }
    else                { badge.textContent = '✓ NORMAL'; badge.className = 'cap-badge ok';   }

    // Alert bar
    const bar = document.getElementById('alert-bar');
    if (pct >= 100) {
      document.getElementById('alert-txt').textContent = `MALL IS FULL — ${occ} / ${maxCap} people inside!`;
      bar.style.display = 'flex';
    } else if (pct >= 80) {
      document.getElementById('alert-txt').textContent = `Approaching capacity — ${pct}% full (${occ} people)`;
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }

    // Hourly chart
    const hIn  = new Array(24).fill(0);
    const hOut = new Array(24).fill(0);
    if (d.hourly) {
      for (let h = 0; h < 24; h++) {
        const b = d.hourly['h' + h];
        if (b) { hIn[h] = b.in || 0; hOut[h] = b.out || 0; }
      }
    }
    if (!chart) initChart();
    chart.data.datasets[0].data = hIn;
    chart.data.datasets[1].data = hOut;
    chart.update('none');

    // Events log
    if (d.events) {
      const evts = Object.values(d.events)
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
        .slice(0, 40);
      renderLog(evts);
    } else {
      renderLog([]);
    }

  }, err => {
    setOnline(false);
    console.error('Firebase error:', err);
  });
}

// ── RESET ─────────────────────────────────
window.doReset = async function () {
  if (!confirm('Reset all counters to zero?\n\nThis will write zeros to Firebase and your ESP32 will pick it up on next sync.')) return;
  await set(ref(db, `malleye/counter/${todayKey()}`), {
    totalIn: 0, totalOut: 0, occupancy: 0,
    peakCount: 0, peakTime: '',
    lastUpdated: new Date().toLocaleTimeString(),
    mallName: 'My Mall', maxCapacity: 5000
  });
};

// ── INIT ──────────────────────────────────
document.getElementById('date-display').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

initChart();
listen();

// Refresh listener at midnight
setInterval(() => {
  const n = new Date();
  if (n.getHours() === 0 && n.getMinutes() === 0) {
    document.getElementById('date-display').textContent = n.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    listen();
  }
}, 60000);
