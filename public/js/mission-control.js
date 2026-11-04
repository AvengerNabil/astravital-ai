// ==============================================================================
// AstraVital AI - Mission Control Wall Dashboard & Emergency Operations
// NASA Space Apps Challenge 2026
// ==============================================================================

class MissionControlWall {
  constructor() {
    window.missionControl = this;
    this.alertsList = [];
    this.activeEmergency = null;
    this.initEventListeners();
    this.fetchAlerts();
  }

  initEventListeners() {
    const triggerBtn = document.getElementById('btn-emergency-modal-open');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.openEmergencyModal());
    }

    const abortBtn = document.getElementById('btn-emergency-abort');
    if (abortBtn) {
      abortBtn.addEventListener('click', () => this.resolveEmergency());
    }

    const confirmTriggerBtn = document.getElementById('btn-emergency-confirm-trigger');
    if (confirmTriggerBtn) {
      confirmTriggerBtn.addEventListener('click', () => this.executeEmergencyProtocol());
    }

    // Modal close and cancel listeners
    const modal = document.getElementById('emergency-modal');
    if (modal) {
      const closeBtn = modal.querySelector('.modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeEmergencyModal());
      }
      const cancelBtn = modal.querySelector('.btn-secondary');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.closeEmergencyModal());
      }
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeEmergencyModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeEmergencyModal();
    });
  }

  async fetchAlerts() {
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Alerts fetch failed');
      const json = await res.json();
      this.alertsList = json.data;
      this.renderAlerts();
    } catch (e) {
      this.renderFallbackAlerts();
    }
  }

  renderFallbackAlerts() {
    this.alertsList = [
      {
        id: 'alt-101',
        astronautName: 'Dr. Marcus Thorne',
        severity: 'HIGH',
        category: 'CARDIAC',
        title: 'Sustained Tachycardia & High Cardiac Workload',
        message: 'Elevated resting HR (86 bpm) with diastolic BP rise to 88 mmHg. Correlates with microgravity vascular remodeling & post-EVA dehydration.',
        isAcknowledged: false,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: 'alt-102',
        astronautName: 'Dr. Marcus Thorne',
        severity: 'MEDIUM',
        category: 'RADIATION',
        title: 'M4.2 Solar Flare Detection - SPE Warning',
        message: 'NOAA SWPC / NASA DONKI alerts solar energetic proton wave. Dosimetry predicts +18 µSv/h elevation. Recommend shelter in water-wall haven.',
        isAcknowledged: false,
        timestamp: new Date().toLocaleTimeString()
      }
    ];
    this.renderAlerts();
  }

  renderAlerts() {
    const container = document.getElementById('mc-alerts-container');
    if (!container) return;

    if (this.alertsList.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-family:'Share Tech Mono';">No active telemetry warnings across fleet.</div>`;
      return;
    }

    container.innerHTML = this.alertsList.map(a => `
      <div style="background: ${a.isAcknowledged ? 'rgba(255,255,255,0.03)' : a.severity === 'CRITICAL' ? 'rgba(255,77,109,0.18)' : a.severity === 'HIGH' ? 'rgba(255,184,0,0.14)' : 'rgba(0,229,255,0.08)'}; border: 1px solid ${a.severity === 'CRITICAL' ? 'var(--danger-red)' : a.severity === 'HIGH' ? 'var(--warning-amber)' : 'var(--accent-cyan)'}; border-radius: 8px; padding: 1rem; margin-bottom: 0.8rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
            <span style="font-family:'Orbitron'; font-size:0.75rem; font-weight:700; color:${a.severity === 'CRITICAL' ? '#FF4D6D' : a.severity === 'HIGH' ? '#FFB800' : '#00E5FF'};">[${a.severity}] ${a.category}</span>
            <span style="font-family:'Rajdhani'; font-weight:bold; font-size:0.95rem; color:#fff;">${a.title}</span>
            <span style="font-family:'Share Tech Mono'; font-size:0.72rem; color:#8E9DB8;">— ${a.astronautName}</span>
          </div>
          <p style="font-size:0.85rem; color:#C2D1E5; line-height:1.4;">${a.message}</p>
        </div>
        <div>
          ${a.isAcknowledged ? `
            <span style="font-family:'Share Tech Mono'; font-size:0.75rem; color:var(--success-green); border:1px solid var(--success-green); padding:0.2rem 0.6rem; border-radius:4px; white-space:nowrap;">ACKNOWLEDGED</span>
          ` : `
            <button onclick="window.missionControl.acknowledgeAlert('${a.id}')" style="background:rgba(0,229,255,0.15); border:1px solid var(--accent-cyan); color:var(--accent-cyan); font-family:'Share Tech Mono'; font-size:0.75rem; padding:0.35rem 0.8rem; border-radius:4px; cursor:pointer; white-space:nowrap;">ACKNOWLEDGE</button>
          `}
        </div>
      </div>
    `).join('');
  }

  async acknowledgeAlert(id) {
    if (window.soundEngine) window.soundEngine.playConfirmChime();
    const alert = this.alertsList.find(a => a.id === id);
    if (alert) alert.isAcknowledged = true;
    this.renderAlerts();

    try {
      await fetch(`/api/alerts/${id}/ack`, { method: 'POST' });
    } catch (e) {}
  }

  openEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (modal) modal.classList.add('active');
    if (window.soundEngine) window.soundEngine.playWarningBeep();
  }

  closeEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (modal) modal.classList.remove('active');
  }

  async executeEmergencyProtocol() {
    this.closeEmergencyModal();

    // Trigger Red Alert HUD Border
    const hud = document.getElementById('emergency-hud-border');
    if (hud) hud.style.display = 'block';

    // Play synthesized emergency siren
    if (window.soundEngine) {
      window.soundEngine.playEmergencyKlaxon();
      this.sirenInterval = setInterval(() => {
        window.soundEngine.playEmergencyKlaxon();
      }, 3500);
    }

    // Set emergency banner in header
    const alertBtn = document.getElementById('btn-emergency-modal-open');
    if (alertBtn) {
      alertBtn.innerText = '⚠️ RED ALERT ACTIVE — STAND DOWN';
      alertBtn.onclick = () => this.resolveEmergency();
    }

    try {
      await fetch('/api/emergency/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'HYPOXIA_AND_CARDIAC_ARREST_SIMULATION',
          astronautId: 'ast-002',
          details: 'Simulated rapid cabin depressurization and acute bradycardia event.'
        })
      });
      this.fetchAlerts();
    } catch (e) {}
  }

  async resolveEmergency() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }

    const hud = document.getElementById('emergency-hud-border');
    if (hud) hud.style.display = 'none';

    const alertBtn = document.getElementById('btn-emergency-modal-open');
    if (alertBtn) {
      alertBtn.innerText = '🚨 EMERGENCY RED ALERT';
      alertBtn.onclick = () => this.openEmergencyModal();
    }

    if (window.soundEngine) window.soundEngine.playConfirmChime();

    try {
      await fetch('/api/emergency/resolve', { method: 'POST' });
      this.fetchAlerts();
    } catch (e) {}
  }

  renderCrewStatusGrid(astronauts) {
    const container = document.getElementById('mc-astronaut-grid');
    if (!container || !astronauts) return;

    container.innerHTML = astronauts.map(ast => {
      const t = ast.telemetry;
      const isOk = t.overallHealthScore >= 85;
      const isWarn = t.overallHealthScore < 85 && t.overallHealthScore >= 65;
      const color = isOk ? 'var(--success-green)' : isWarn ? 'var(--warning-amber)' : 'var(--danger-red)';
      const statusClass = isOk ? 'score-badge-green' : isWarn ? 'score-badge-amber' : 'score-badge-red';

      return `
        <div class="glass-panel mc-astronaut-tile" style="border-left: 4px solid ${color};">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <img src="${ast.avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:1px solid var(--border-cyan);">
              <div>
                <h4 style="font-size:0.88rem; font-family:'Orbitron';">${ast.name}</h4>
                <span style="font-family:'Share Tech Mono'; font-size:0.72rem; color:var(--accent-cyan);">${ast.destination || ast.mission}</span>
              </div>
            </div>
            <span class="crew-badge-score ${statusClass}">${t.overallHealthScore}/100</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; background:rgba(0,0,0,0.3); padding:0.6rem; border-radius:6px; text-align:center; font-family:'Share Tech Mono'; font-size:0.75rem;">
            <div>
              <span style="color:#546481; display:block; font-size:0.65rem;">HEART RATE</span>
              <span style="color:${t.heartRate > 85 ? '#FFB800' : '#00FF99'}; font-weight:bold; font-size:0.95rem;">${t.heartRate} bpm</span>
            </div>
            <div>
              <span style="color:#546481; display:block; font-size:0.65rem;">SpO2 OXYGEN</span>
              <span style="color:${t.spo2 < 96 ? '#FFB800' : '#00E5FF'}; font-weight:bold; font-size:0.95rem;">${t.spo2}%</span>
            </div>
            <div>
              <span style="color:#546481; display:block; font-size:0.65rem;">RAD DOSE</span>
              <span style="color:${t.radiationDoseRateUsvH > 40 ? '#FFB800' : '#7B61FF'}; font-weight:bold; font-size:0.95rem;">${t.radiationDoseRateUsvH} µSv/h</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.MissionControlWall = MissionControlWall;
