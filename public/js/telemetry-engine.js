// ==============================================================================
// AstraVital AI - 10-Parameter Simulated Telemetry Engine Controller
// NASA Space Apps Challenge 2026
// Mandatory Provenance Notice: SIMULATED DATA – NOT REAL ASTRONAUT TELEMETRY
// ==============================================================================

class SimulatedTelemetryEngine {
  constructor(app) {
    this.app = app;
    this.isPaused = false;
    this.activeScenario = 'nominal';
    this.seed = 1337;
    this.exerciseSession = {
      isActive: false,
      type: 'SQUATS',
      startTime: 0,
      timer: null,
      reps: 0,
      calories: 0,
      heartRate: 72
    };

    this.init();
  }

  init() {
    this.setupControlListeners();
    this.setupExerciseSimulator();
    this.setupExportButtons();
    this.renderTelemetryBadges();
  }

  setupControlListeners() {
    const pauseBtn = document.getElementById('btn-sim-pause');
    const resumeBtn = document.getElementById('btn-sim-resume');
    const resetBtn = document.getElementById('btn-sim-reset');
    const scenarioSelect = document.getElementById('select-sim-scenario');
    const seedInput = document.getElementById('input-sim-seed');
    const applySeedBtn = document.getElementById('btn-sim-apply-seed');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.setPause(true));
    }
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.setPause(false));
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSimulation());
    }
    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', (e) => this.injectScenario(e.target.value));
    }
    if (applySeedBtn && seedInput) {
      applySeedBtn.addEventListener('click', () => {
        const val = parseInt(seedInput.value, 10);
        if (!isNaN(val)) {
          this.seed = val;
          this.syncControlToServer({ seed: this.seed });
        }
      });
    }
  }

  async setPause(pause) {
    this.isPaused = pause;
    const pauseBtn = document.getElementById('btn-sim-pause');
    const resumeBtn = document.getElementById('btn-sim-resume');
    const statusPill = document.getElementById('sim-status-pill');

    if (pauseBtn) pauseBtn.disabled = pause;
    if (resumeBtn) resumeBtn.disabled = !pause;
    if (statusPill) {
      statusPill.innerText = pause ? 'SIMULATION PAUSED' : 'LIVE STREAMING';
      statusPill.className = pause ? 'status-pill paused' : 'status-pill live';
    }

    await this.syncControlToServer({ action: pause ? 'pause' : 'resume' });
  }

  async resetSimulation() {
    this.isPaused = false;
    this.activeScenario = 'nominal';
    const pauseBtn = document.getElementById('btn-sim-pause');
    const resumeBtn = document.getElementById('btn-sim-resume');
    const scenarioSelect = document.getElementById('select-sim-scenario');
    const statusPill = document.getElementById('sim-status-pill');

    if (pauseBtn) pauseBtn.disabled = false;
    if (resumeBtn) resumeBtn.disabled = true;
    if (scenarioSelect) scenarioSelect.value = 'nominal';
    if (statusPill) {
      statusPill.innerText = 'LIVE STREAMING';
      statusPill.className = 'status-pill live';
    }

    await this.syncControlToServer({ action: 'reset' });
  }

  async injectScenario(scenario) {
    this.activeScenario = scenario;
    await this.syncControlToServer({ action: 'scenario', scenario });

    if (window.soundEngine) {
      if (scenario === 'critical') window.soundEngine.playKlaxon();
      else window.soundEngine.playTelemetryBeep(900, 0.08);
    }
  }

  async syncControlToServer(payload) {
    try {
      await fetch('/api/telemetry/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Failed to sync telemetry control to server:', e);
    }
  }

  setupExportButtons() {
    const jsonBtn = document.getElementById('btn-export-telemetry-json');
    const csvBtn = document.getElementById('btn-export-telemetry-csv');

    if (jsonBtn) {
      jsonBtn.addEventListener('click', () => {
        window.open('/api/telemetry/export?format=json', '_blank');
      });
    }
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        window.open('/api/telemetry/export?format=csv', '_blank');
      });
    }
  }

  // Integrates the user's Physical Exercise Simulator from updated files
  setupExerciseSimulator() {
    const typeEl = document.getElementById('exercise-type');
    const startBtn = document.getElementById('exercise-start-btn');
    const stopBtn = document.getElementById('exercise-stop-btn');

    const currentEl = document.getElementById('exercise-current');
    const repsEl = document.getElementById('exercise-reps');
    const heartRateEl = document.getElementById('exercise-heart-rate');
    const caloriesEl = document.getElementById('exercise-calories');
    const resultEl = document.getElementById('exercise-result');

    const telemetryStatusEl = document.getElementById('telemetry-exercise-status');
    const telemetryRepsEl = document.getElementById('telemetry-exercise-reps');
    const telemetryDurationEl = document.getElementById('telemetry-exercise-duration');
    const telemetryHeartRateEl = document.getElementById('telemetry-exercise-heart-rate');
    const telemetryCaloriesEl = document.getElementById('telemetry-exercise-calories');

    if (!typeEl || !startBtn || !stopBtn || !currentEl || !repsEl || !heartRateEl || !caloriesEl || !resultEl) {
      return;
    }

    startBtn.addEventListener('click', () => {
      if (this.exerciseSession.isActive) return;

      this.exerciseSession.isActive = true;
      this.exerciseSession.startTime = Date.now();
      this.exerciseSession.reps = 0;
      this.exerciseSession.calories = 0;

      const exerciseName = typeEl.options[typeEl.selectedIndex].text;
      this.exerciseSession.type = exerciseName;

      currentEl.innerText = exerciseName;
      repsEl.innerText = '0';
      heartRateEl.innerText = '90 BPM';
      caloriesEl.innerText = '0 kcal';
      resultEl.innerHTML = '';

      if (telemetryStatusEl) telemetryStatusEl.innerText = 'ACTIVE';
      if (telemetryRepsEl) telemetryRepsEl.innerText = '0';
      if (telemetryDurationEl) telemetryDurationEl.innerText = '0';
      if (telemetryHeartRateEl) telemetryHeartRateEl.innerText = '90';
      if (telemetryCaloriesEl) telemetryCaloriesEl.innerText = '0';

      startBtn.disabled = true;
      stopBtn.disabled = false;
      typeEl.disabled = true;

      this.exerciseSession.timer = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - this.exerciseSession.startTime) / 1000);
        this.exerciseSession.reps = Math.floor(elapsedSeconds / 3);
        const hr = Math.min(150, 90 + Math.floor(elapsedSeconds * 1.5));
        const cal = Math.round(elapsedSeconds * 0.12 * 10) / 10;

        repsEl.innerText = this.exerciseSession.reps;
        heartRateEl.innerText = `${hr} BPM`;
        caloriesEl.innerText = `${cal} kcal`;

        if (telemetryRepsEl) telemetryRepsEl.innerText = this.exerciseSession.reps;
        if (telemetryDurationEl) telemetryDurationEl.innerText = elapsedSeconds;
        if (telemetryHeartRateEl) telemetryHeartRateEl.innerText = hr;
        if (telemetryCaloriesEl) telemetryCaloriesEl.innerText = cal;
      }, 1000);
    });

    stopBtn.addEventListener('click', () => {
      if (!this.exerciseSession.isActive) return;

      this.exerciseSession.isActive = false;
      clearInterval(this.exerciseSession.timer);
      this.exerciseSession.timer = null;

      const durationSeconds = Math.floor((Date.now() - this.exerciseSession.startTime) / 1000);
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const durationText = `${minutes}m ${seconds}s`;

      currentEl.innerText = 'COMPLETED';

      if (telemetryStatusEl) telemetryStatusEl.innerText = 'COMPLETED';
      if (telemetryRepsEl) telemetryRepsEl.innerText = this.exerciseSession.reps;
      if (telemetryDurationEl) telemetryDurationEl.innerText = durationSeconds;
      if (telemetryHeartRateEl) telemetryHeartRateEl.innerText = heartRateEl.innerText.replace(' BPM', '');
      if (telemetryCaloriesEl) telemetryCaloriesEl.innerText = this.exerciseSession.calories;

      startBtn.disabled = false;
      stopBtn.disabled = true;
      typeEl.disabled = false;

      resultEl.innerHTML = `
        <div style="padding:0.8rem; border:1px solid #546481; border-radius:6px; background:rgba(0,0,0,0.25);">
          <strong style="color:var(--success-green);">✓ Exercise Session Complete</strong>
          <div style="margin-top:0.4rem;">Exercise: ${typeEl.options[typeEl.selectedIndex].text}</div>
          <div>Duration: ${durationText}</div>
          <div>Total Reps: ${this.exerciseSession.reps}</div>
          <div>Estimated Calories: ${caloriesEl.innerText}</div>
          <div style="margin-top:0.5rem; color:#8E9DB8; font-size:0.72rem;">
            SIMULATION RESULT • Not a medical measurement
          </div>
        </div>
      `;
    });
  }

  renderTelemetryBadges() {
    // Add prominent visible simulation banners across dashboards
    document.querySelectorAll('.simulated-banner-container').forEach(el => {
      el.innerHTML = `
        <div class="sim-banner-pill">
          <span class="sim-dot"></span>
          <span>SIMULATED DATA – NOT REAL ASTRONAUT TELEMETRY</span>
        </div>
      `;
    });
  }
}

window.SimulatedTelemetryEngine = SimulatedTelemetryEngine;

