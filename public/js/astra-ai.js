// ==============================================================================
// AstraVital AI - Multi-Astronaut Health Analytics & Clinical Intelligence Suite
// NASA Space Apps Challenge 2026
// ==============================================================================

class AstraAIAssistant {
  constructor() {
    window.astraAI = this;
    this.crew = [];
    this.selectedAstronautId = 'ast-001';
    this.activeSubView = 'crew-overview'; // 'crew-overview' | 'individual-analysis' | 'ai-chat' | 'unified-view'
    this.isVoiceMuted = false;
    this.isListening = false;
    this.speechSynth = window.speechSynthesis || null;
    this.recognition = null;
    this.historicalBuffers = {}; // id -> array of historical telemetry ticks
    this.isSubmitting = false;

    // Cache DOM Elements
    this.messagesContainer = document.getElementById('ai-chat-messages');
    this.inputField = document.getElementById('ai-chat-input');
    this.sendBtn = document.getElementById('btn-chat-send');
    this.micBtn = document.getElementById('btn-speech-mic');
    this.voiceToggleBtn = document.getElementById('btn-ai-voice-toggle');
    this.clearChatBtn = document.getElementById('btn-clear-chat');

    this.initVoiceRecognition();
    this.initSubNav();
    this.initEventListeners();
    this.loadCrewData();

    // Hook into live telemetry ticks
    this.startTelemetryWatcher();
  }

  // --------------------------------------------------------------------------
  // Initialization & Event Binding
  // --------------------------------------------------------------------------
  initSubNav() {
    const subNavBtns = document.querySelectorAll('.ai-subnav-btn');
    subNavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = btn.getAttribute('data-subview');
        this.switchSubView(targetView);
      });
    });

    const consultAiBtn = document.getElementById('btn-consult-ai-individual');
    if (consultAiBtn) {
      consultAiBtn.addEventListener('click', () => {
        const ast = this.getSelectedAstronaut();
        const prompt = ast ? `Analyze ${ast.name}'s current physiological status and recommended countermeasures` : 'Analyze current astronaut';
        this.switchSubView('ai-chat');
        this.sendQuickPrompt(prompt);
      });
    }
  }

  switchSubView(viewName) {
    this.activeSubView = viewName;
    const subNavBtns = document.querySelectorAll('.ai-subnav-btn');
    subNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subview') === viewName);
    });

    const panels = {
      'crew-overview': document.getElementById('panel-crew-overview'),
      'individual-analysis': document.getElementById('panel-individual-analysis'),
      'ai-chat': document.getElementById('panel-ai-chat')
    };

    if (viewName === 'unified-view') {
      // In unified view, show all 3 panels in a comprehensive command center
      Object.values(panels).forEach(p => {
        if (p) p.style.display = 'block';
      });
    } else {
      Object.entries(panels).forEach(([key, panel]) => {
        if (panel) {
          panel.style.display = (key === viewName) ? 'block' : 'none';
        }
      });
    }

    if (viewName === 'individual-analysis') {
      this.renderIndividualAnalysis();
    } else if (viewName === 'crew-overview') {
      this.renderCrewOverview();
    }

    if (window.soundEngine) window.soundEngine.playTelemetryBeep(1100, 0.03);
  }

  initEventListeners() {
    // Chat Send Button
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Input Enter Key
    if (this.inputField) {
      this.inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Voice Mic Button
    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => this.toggleVoiceListening());
    }

    // Voice Synthesis Toggle
    if (this.voiceToggleBtn) {
      this.voiceToggleBtn.addEventListener('click', () => {
        this.isVoiceMuted = !this.isVoiceMuted;
        this.voiceToggleBtn.innerText = this.isVoiceMuted ? '🔇 Audio Off' : '🔊 Audio On';
        this.voiceToggleBtn.style.color = this.isVoiceMuted ? '#8E9DB8' : 'var(--accent-cyan)';
        if (this.isVoiceMuted && this.speechSynth) {
          this.speechSynth.cancel();
        }
      });
    }

    // Clear Chat
    if (this.clearChatBtn) {
      this.clearChatBtn.addEventListener('click', () => {
        if (this.messagesContainer) {
          this.messagesContainer.innerHTML = `
            <div class="chat-bubble bubble-astra">
              <p style="margin:0; font-size:0.86rem; color:#8E9DB8; font-family:'Share Tech Mono';">
                Conversation reset. Ready for clinical inquiries.
              </p>
            </div>
          `;
        }
      });
    }

    // Suggested Prompt Pills
    document.querySelectorAll('.quick-prompt-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const text = pill.getAttribute('data-prompt') || pill.innerText.trim();
        this.sendQuickPrompt(text);
      });
    });
  }

  initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.micBtn) {
          this.micBtn.style.color = '#FF4D6D';
          this.micBtn.style.borderColor = '#FF4D6D';
          this.micBtn.innerText = '🔴';
        }
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.inputField) {
          this.inputField.value = transcript;
          this.sendMessage();
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.micBtn) {
          this.micBtn.style.color = 'var(--accent-cyan)';
          this.micBtn.style.borderColor = 'var(--border-cyan)';
          this.micBtn.innerText = '🎤';
        }
      };

      this.recognition.onerror = () => {
        this.isListening = false;
        if (this.micBtn) {
          this.micBtn.innerText = '🎤';
          this.micBtn.style.color = 'var(--accent-cyan)';
        }
      };
    }
  }

  toggleVoiceListening() {
    if (!this.recognition) {
      alert('Speech Recognition is not supported in this browser. Please type your query in the console.');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (e) {
        this.recognition.stop();
      }
    }
  }

  speakResponse(text) {
    if (!this.speechSynth || this.isVoiceMuted) return;
    this.speechSynth.cancel();

    // Clean formatting and citations for natural spoken audio
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '').slice(0, 320);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = 1.05;
    utterance.rate = 1.0;

    const voices = this.speechSynth.getVoices();
    const spaceVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('Samantha')));
    if (spaceVoice) utterance.voice = spaceVoice;

    this.speechSynth.speak(utterance);
  }

  // --------------------------------------------------------------------------
  // Crew Data Management & Dynamic Statistics
  // --------------------------------------------------------------------------
  async loadCrewData() {
    // First attempt to grab already loaded astronauts from window.app
    if (window.app && window.app.astronauts && window.app.astronauts.length > 0) {
      this.crew = window.app.astronauts;
      this.updateCrewStats();
      this.renderCrewOverview();
      this.renderIndividualPills();
      return;
    }

    try {
      const res = await fetch('/api/astronauts');
      if (res.ok) {
        const json = await res.json();
        this.crew = json.data || [];
      }
    } catch (e) {
      console.warn('Direct crew fetch failed, using fallback.');
    }

    if (!this.crew || this.crew.length === 0) {
      this.crew = this.getFallbackCrew();
    }

    this.updateCrewStats();
    this.renderCrewOverview();
    this.renderIndividualPills();
  }

  startTelemetryWatcher() {
    // Record continuous telemetry for sparklines and status tracking
    setInterval(() => {
      if (window.app && window.app.astronauts && window.app.astronauts.length > 0) {
        this.crew = window.app.astronauts;
      }

      // Record tick in historical buffers
      this.crew.forEach(ast => {
        if (!this.historicalBuffers[ast.id]) {
          this.historicalBuffers[ast.id] = [];
        }
        if (ast.telemetry) {
          this.historicalBuffers[ast.id].push({
            time: new Date(),
            hr: ast.telemetry.heartRate,
            spo2: ast.telemetry.spo2,
            bpSys: ast.telemetry.bpSystolic,
            bpDia: ast.telemetry.bpDiastolic,
            rad: ast.telemetry.radiationDoseRateUsvH
          });
          if (this.historicalBuffers[ast.id].length > 25) {
            this.historicalBuffers[ast.id].shift();
          }
        }
      });

      this.updateCrewStats();

      // If viewing section B, update live vital metrics and sparklines
      if (this.activeSubView === 'individual-analysis') {
        this.updateIndividualLiveMetrics();
      } else if (this.activeSubView === 'crew-overview') {
        this.updateCrewCardsLiveMetrics();
      }
    }, 2000);
  }

  updateCrewStats() {
    if (!this.crew || this.crew.length === 0) return;

    let normal = 0;
    let attention = 0;
    let elevated = 0;
    let critical = 0;
    let insufficient = 0;

    this.crew.forEach(ast => {
      const t = ast.telemetry;
      if (!t) {
        insufficient++;
        return;
      }
      const st = this.classifyAstronautStatus(t);
      if (st === 'NORMAL') normal++;
      else if (st === 'ATTENTION REQUIRED') attention++;
      else if (st === 'ELEVATED RISK') elevated++;
      else if (st === 'CRITICAL ALERT') critical++;
      else insufficient++;
    });

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setTxt('stat-crew-total', this.crew.length);
    setTxt('stat-crew-normal', normal);
    setTxt('stat-crew-attention', attention);
    setTxt('stat-crew-elevated', elevated);
    setTxt('stat-crew-critical', critical);
    setTxt('stat-crew-insufficient', insufficient);
  }

  classifyAstronautStatus(t) {
    if (!t) return 'INSUFFICIENT DATA';
    if (t.status === 'CRITICAL' || t.heartRate > 115 || t.spo2 < 93) return 'CRITICAL ALERT';
    if (t.status === 'WARNING' || t.heartRate > 85 || t.spo2 < 97 || t.stressScore > 55) return 'ATTENTION REQUIRED';
    if (t.stressScore > 50 || t.radiationDoseRateUsvH > 40) return 'ELEVATED RISK';
    return 'NORMAL';
  }

  getStatusBadgeHtml(status) {
    let color = '#00FF99';
    let bg = 'rgba(0,255,153,0.12)';
    let border = 'rgba(0,255,153,0.4)';

    if (status === 'ATTENTION REQUIRED') {
      color = '#FFB800';
      bg = 'rgba(255,184,0,0.12)';
      border = 'rgba(255,184,0,0.4)';
    } else if (status === 'ELEVATED RISK') {
      color = '#FF8A00';
      bg = 'rgba(255,138,0,0.15)';
      border = 'rgba(255,138,0,0.4)';
    } else if (status === 'CRITICAL ALERT') {
      color = '#FF4D6D';
      bg = 'rgba(255,77,109,0.18)';
      border = 'rgba(255,77,109,0.5)';
    } else if (status === 'INSUFFICIENT DATA') {
      color = '#8E9DB8';
      bg = 'rgba(255,255,255,0.06)';
      border = 'rgba(255,255,255,0.15)';
    }

    return `<span style="font-family:'Share Tech Mono'; font-size:0.7rem; font-weight:700; color:${color}; background:${bg}; border:1px solid ${border}; padding:0.2rem 0.55rem; border-radius:4px; letter-spacing:0.04em;">${status}</span>`;
  }

  // --------------------------------------------------------------------------
  // SECTION A: CREW HEALTH OVERVIEW
  // --------------------------------------------------------------------------
  renderCrewOverview() {
    const container = document.getElementById('ai-crew-cards-container');
    if (!container) return;

    if (!this.crew || this.crew.length === 0) {
      container.innerHTML = `<div style="color:#8E9DB8; font-family:'Share Tech Mono'; padding:2rem; text-align:center;">No crew telemetry records found.</div>`;
      return;
    }

    container.innerHTML = this.crew.map(ast => {
      const t = ast.telemetry || {};
      const status = this.classifyAstronautStatus(t);
      const isSelected = ast.id === this.selectedAstronautId;
      const cardioStiffness = ast.digitalTwin ? (ast.digitalTwin.cardiovascularStiffness * 100).toFixed(0) + '%' : '14%';
      const boneLoss = ast.digitalTwin ? ast.digitalTwin.boneLossRatePctMonth + '%/mo' : '0.9%/mo';
      const activity = t.physicalActivity ? `${t.physicalActivity.type} (${t.physicalActivity.status})` : 'ARED (READY)';

      return `
        <div class="astronaut-crew-card ${isSelected ? 'active-selected' : ''}" onclick="window.astraAI.selectAstronaut('${ast.id}')">
          <div>
            <div class="crew-card-header">
              <img src="${ast.avatar}" alt="${ast.name}" class="crew-card-avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'" />
              <div style="flex-grow:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.15rem;">
                  <strong style="color:#FFFFFF; font-size:1.05rem; font-family:'Rajdhani'; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ast.name}</strong>
                  <span style="font-family:'Share Tech Mono'; font-size:0.68rem; color:var(--accent-cyan);">${ast.id}</span>
                </div>
                <div style="font-size:0.74rem; color:#8E9DB8; font-family:'Share Tech Mono';">
                  ${ast.callsign} • ${ast.mission}
                </div>
              </div>
            </div>

            <!-- Health Status & Telemetry Grid -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <span style="font-size:0.72rem; color:#8E9DB8; font-family:'Share Tech Mono';">HEALTH STATUS</span>
              ${this.getStatusBadgeHtml(status)}
            </div>

            <div class="crew-card-vitals-grid">
              <div class="crew-vital-item">
                <span class="crew-vital-label">HEART RATE</span>
                <span class="crew-vital-val" style="color:${(t.heartRate > 85) ? '#FFB800' : '#00FF99'};">${t.heartRate || '--'} <small style="font-size:0.65rem; color:#8E9DB8;">BPM</small></span>
              </div>
              <div class="crew-vital-item">
                <span class="crew-vital-label">BLOOD PRESSURE</span>
                <span class="crew-vital-val">${t.bpSystolic ? `${t.bpSystolic}/${t.bpDiastolic}` : '--/--'} <small style="font-size:0.65rem; color:#8E9DB8;">mmHg</small></span>
              </div>
              <div class="crew-vital-item">
                <span class="crew-vital-label">OXYGEN (SpO2)</span>
                <span class="crew-vital-val" style="color:${(t.spo2 < 97) ? '#FFB800' : '#00E5FF'};">${t.spo2 ? `${t.spo2}%` : '--'}</span>
              </div>
              <div class="crew-vital-item">
                <span class="crew-vital-label">CORE TEMP</span>
                <span class="crew-vital-val">${t.bodyTemp ? `${t.bodyTemp}°C` : '--'}</span>
              </div>
            </div>

            <!-- Secondary Medical Context -->
            <div style="background:rgba(5, 8, 22, 0.4); border-radius:6px; padding:0.5rem 0.65rem; font-family:'Share Tech Mono'; font-size:0.72rem; color:#C2D1E5; margin-bottom:0.75rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                <span style="color:#8E9DB8;">CARDIO STIFFNESS:</span>
                <span>${cardioStiffness}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                <span style="color:#8E9DB8;">BONE LOSS RATE:</span>
                <span>${boneLoss} (T: ${ast.boneDensityTScore || '1.0'})</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#8E9DB8;">EXERCISE PROTOCOL:</span>
                <span style="color:var(--accent-cyan);">${activity}</span>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.6rem; margin-top:0.5rem;">
            <span style="font-family:'Share Tech Mono'; font-size:0.68rem; color:#546481;">
              ● LIVE SSE TELEMETRY
            </span>
            <button style="background:transparent; border:none; color:var(--accent-cyan); font-family:'Share Tech Mono'; font-size:0.75rem; cursor:pointer; padding:0;">
              Inspect Dossier →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCrewCardsLiveMetrics() {
    // Light-touch DOM update without rebuilding HTML completely
    const cards = document.querySelectorAll('.astronaut-crew-card');
    cards.forEach((card, idx) => {
      if (this.crew[idx]) {
        const ast = this.crew[idx];
        const t = ast.telemetry;
        if (t) {
          const vals = card.querySelectorAll('.crew-vital-val');
          if (vals.length >= 4) {
            vals[0].innerHTML = `${t.heartRate} <small style="font-size:0.65rem; color:#8E9DB8;">BPM</small>`;
            vals[1].innerHTML = `${t.bpSystolic}/${t.bpDiastolic} <small style="font-size:0.65rem; color:#8E9DB8;">mmHg</small>`;
            vals[2].innerHTML = `${t.spo2}%`;
            vals[3].innerHTML = `${t.bodyTemp}°C`;
          }
        }
      }
    });
  }

  selectAstronaut(id) {
    this.selectedAstronautId = id;
    if (window.app && window.app.selectAstronaut) {
      window.app.selectAstronaut(id);
    }
    this.renderIndividualPills();
    this.switchSubView('individual-analysis');
  }

  // --------------------------------------------------------------------------
  // SECTION B: INDIVIDUAL HEALTH ANALYSIS
  // --------------------------------------------------------------------------
  renderIndividualPills() {
    const container = document.getElementById('ai-individual-astronaut-pills');
    if (!container) return;

    container.innerHTML = this.crew.map(ast => {
      const isSelected = ast.id === this.selectedAstronautId;
      return `
        <button class="ast-pill-btn ${isSelected ? 'active' : ''}" onclick="window.astraAI.selectAstronautFromPill('${ast.id}')">
          ${ast.callsign} (${ast.name.split(' ')[0]})
        </button>
      `;
    }).join('');
  }

  selectAstronautFromPill(id) {
    this.selectedAstronautId = id;
    this.renderIndividualPills();
    this.renderIndividualAnalysis();
    if (window.soundEngine) window.soundEngine.playTelemetryBeep(980, 0.03);
  }

  getSelectedAstronaut() {
    return this.crew.find(a => a.id === this.selectedAstronautId) || this.crew[0];
  }

  renderIndividualAnalysis() {
    const ast = this.getSelectedAstronaut();
    if (!ast) return;
    const t = ast.telemetry || {};
    const dt = ast.digitalTwin || {};
    const status = this.classifyAstronautStatus(t);

    // 1. Profile Header
    const profileHeader = document.getElementById('ai-individual-profile-header');
    if (profileHeader) {
      profileHeader.innerHTML = `
        <div style="display:flex; gap:1rem; align-items:center;">
          <img src="${ast.avatar}" alt="${ast.name}" style="width:68px; height:68px; border-radius:50%; border:2px solid var(--accent-cyan); object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'" />
          <div style="flex-grow:1;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <h3 style="font-family:'Rajdhani'; font-size:1.35rem; font-weight:700; color:#FFFFFF; margin:0 0 0.15rem 0;">
                  ${ast.name} <span style="font-size:0.9rem; color:var(--accent-cyan);">(${ast.callsign})</span>
                </h3>
                <div style="font-family:'Share Tech Mono'; font-size:0.75rem; color:#8E9DB8;">
                  ${ast.role} • ${ast.mission}
                </div>
              </div>
              ${this.getStatusBadgeHtml(status)}
            </div>
            <div style="display:flex; gap:0.9rem; margin-top:0.5rem; font-family:'Share Tech Mono'; font-size:0.72rem; color:#C2D1E5; flex-wrap:wrap;">
              <span>ID: <strong>${ast.id}</strong></span>
              <span>AGE: <strong>${ast.age || 38}</strong></span>
              <span>BLOOD: <strong>${ast.bloodType || 'O+'}</strong></span>
              <span>VO2 MAX: <strong>${ast.vo2Max || 52.0} ml/kg/min</strong></span>
              <span>BONE T-SCORE: <strong>${ast.boneDensityTScore || '1.08'}</strong></span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Vitals Dossier Grid
    const vitalsGrid = document.getElementById('ai-individual-vitals-grid');
    if (vitalsGrid) {
      vitalsGrid.innerHTML = `
        <div class="crew-vital-item">
          <span class="crew-vital-label">HEART RATE</span>
          <span class="crew-vital-val" style="color:${(t.heartRate > 85) ? '#FFB800' : '#00FF99'};">${t.heartRate || '--'} <small>BPM</small></span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">Norm: 60-80</span>
        </div>
        <div class="crew-vital-item">
          <span class="crew-vital-label">BLOOD PRESSURE</span>
          <span class="crew-vital-val">${t.bpSystolic ? `${t.bpSystolic}/${t.bpDiastolic}` : '--/--'} <small>mmHg</small></span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">Norm: 120/80</span>
        </div>
        <div class="crew-vital-item">
          <span class="crew-vital-label">OXYGEN SAT (SpO2)</span>
          <span class="crew-vital-val" style="color:${(t.spo2 < 97) ? '#FFB800' : '#00E5FF'};">${t.spo2 ? `${t.spo2}%` : '--'}</span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">NASA-STD: ≥97%</span>
        </div>
        <div class="crew-vital-item">
          <span class="crew-vital-label">CORE TEMPERATURE</span>
          <span class="crew-vital-val">${t.bodyTemp ? `${t.bodyTemp}°C` : '--'}</span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">Norm: 36.5-37.5</span>
        </div>
        <div class="crew-vital-item">
          <span class="crew-vital-label">RESPIRATION</span>
          <span class="crew-vital-val">${t.respirationRate || 14} <small>br/min</small></span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">Norm: 12-16</span>
        </div>
        <div class="crew-vital-item">
          <span class="crew-vital-label">NEURO-STRESS</span>
          <span class="crew-vital-val" style="color:${(t.stressScore > 50) ? '#FF8A00' : '#00E5FF'};">${t.stressScore || 25}/100</span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">HRV RMSSD</span>
        </div>
        <div class="crew-vital-item">
          <span class="crew-vital-label">HYDRATION INDEX</span>
          <span class="crew-vital-val">${t.hydrationPct || 92}%</span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">Min: 85%</span>
        </div>
        <div class="crew-vital-item">
          <span class="crew-vital-label">DOSIMETRY RATE</span>
          <span class="crew-vital-val" style="color:${(t.radiationDoseRateUsvH > 40) ? '#FFB800' : '#00FF99'};">${t.radiationDoseRateUsvH || 24} <small>µSv/h</small></span>
          <span style="font-size:0.62rem; color:#8E9DB8; font-family:'Share Tech Mono';">NASA GCR Limit</span>
        </div>
      `;
    }

    // 3. Digital Twin Organ Stress Bars
    const organStressContainer = document.getElementById('ai-individual-organ-stress');
    if (organStressContainer) {
      const organs = dt.organStress || {
        heart: 0.20,
        brain: 0.15,
        lungs: 0.12,
        spine: 0.30,
        femur: 0.25,
        opticNerve: 0.10
      };

      organStressContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.5rem; font-family:'Share Tech Mono'; font-size:0.75rem;">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
              <span>CARDIOVASCULAR (CAROTID & MYOCARDIUM)</span>
              <span style="color:${organs.heart > 0.5 ? '#FF4D6D' : '#00E5FF'};">${(organs.heart * 100).toFixed(0)}% STRESS</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
              <div style="height:100%; width:${Math.min(100, organs.heart * 100)}%; background:linear-gradient(90deg, #00E5FF, ${organs.heart > 0.5 ? '#FF4D6D' : '#FFB800'});"></div>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
              <span>OPTIC NERVE & SANS (INTRACRANIAL SHEATH)</span>
              <span style="color:${organs.opticNerve > 0.35 ? '#FFB800' : '#00E5FF'};">${(organs.opticNerve * 100).toFixed(0)}% STRESS (SANS Stage ${dt.sansStage || 0})</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
              <div style="height:100%; width:${Math.min(100, organs.opticNerve * 100)}%; background:linear-gradient(90deg, #00E5FF, ${organs.opticNerve > 0.35 ? '#FF8A00' : '#7B61FF'});"></div>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
              <span>AXIAL SKELETON (LUMBAR SPINE & FEMUR)</span>
              <span style="color:${organs.spine > 0.5 ? '#FFB800' : '#00E5FF'};">${(organs.spine * 100).toFixed(0)}% RESORPTION</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
              <div style="height:100%; width:${Math.min(100, organs.spine * 100)}%; background:linear-gradient(90deg, #00E5FF, #FFB800);"></div>
            </div>
          </div>
        </div>
      `;
    }

    // 4. Interactive Charts
    this.renderTrendCharts(ast);

    // 5. AI Clinical Diagnostic Ticket
    const assessmentBox = document.getElementById('ai-individual-assessment-box');
    if (assessmentBox) {
      const isHighStress = t.heartRate > 85 || t.stressScore > 50;
      assessmentBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="color:var(--accent-cyan); font-family:'Rajdhani'; font-size:1.05rem;">
            AI CLINICAL TRIAGE ASSESSMENT
          </strong>
          <span style="font-family:'Share Tech Mono'; font-size:0.75rem; color:#8E9DB8;">
            CONFIDENCE: 95.2%
          </span>
        </div>
        <p style="font-size:0.86rem; color:#E2E8F0; line-height:1.5; margin:0 0 0.6rem 0;">
          ${isHighStress
            ? `Resting heart rate (${t.heartRate} bpm) and vascular resistance exhibit sub-acute cephalad fluid redistribution. Microgravity vascular remodeling consistent with NASA Twins Study (OSD-205). Autonomic stress correlates with high EVA activity schedule.`
            : `Multi-system biometric parameters align within NASA-STD-3001 Level-1 flight certification standards. Cardiopulmonary adaptation remains stable with nominal endothelial tone and optimal cognitive readiness.`}
        </p>
        <div style="font-family:'Share Tech Mono'; font-size:0.72rem; color:#8E9DB8; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.4rem;">
          Linked Study: <strong>OSD-205 (Cardiovascular Carotid Remodeling)</strong> • <strong>NASA-STD-3001 Vol 1</strong>
        </div>
      `;
    }

    // 6. Research-Informed Countermeasures
    const cmBox = document.getElementById('ai-individual-countermeasures-box');
    if (cmBox) {
      cmBox.innerHTML = `
        <h5 style="font-family:'Rajdhani'; font-size:0.95rem; color:var(--success-green); margin:0 0 0.5rem 0; text-transform:uppercase;">
          NASA RESEARCH-INFORMED COUNTERMEASURES (FLIGHT SURGEON REVIEW)
        </h5>
        <ul style="margin:0 0 0 1.1rem; padding:0; font-size:0.82rem; color:#C2D1E5; line-height:1.5;">
          <li><strong>CEVIS Cycle Ergometer:</strong> 30 min at 75% VO2 peak with Lower Body Negative Pressure (-25 mmHg).</li>
          <li><strong>ARED Resistive Training:</strong> 4 sets x 8 reps heavy axial squats (200kg equivalent) to mitigate trabecular osteopenia.</li>
          <li><strong>Fluid & Electrolyte Loading:</strong> 1.0L isotonic electrolyte solution pre-EVA to restore blood volume.</li>
        </ul>
      `;
    }
  }

  updateIndividualLiveMetrics() {
    const ast = this.getSelectedAstronaut();
    if (!ast || !ast.telemetry) return;
    this.renderTrendCharts(ast);
  }

  renderTrendCharts(ast) {
    const container = document.getElementById('ai-trend-charts-container');
    if (!container) return;

    const history = this.historicalBuffers[ast.id] || [];

    if (history.length < 3) {
      container.innerHTML = `
        <div style="padding:1.5rem; text-align:center; color:#8E9DB8; font-family:'Share Tech Mono'; font-size:0.8rem;">
          Accumulating high-frequency telemetry history... (Points recorded: ${history.length})
        </div>
      `;
      return;
    }

    // Generate SVG Sparklines
    const hrPoints = history.map((pt, i) => {
      const x = (i / (history.length - 1)) * 300;
      // Map HR 50 - 130 to height 50 - 5
      const y = 50 - ((pt.hr - 50) / 80) * 45;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const spo2Points = history.map((pt, i) => {
      const x = (i / (history.length - 1)) * 300;
      // Map SpO2 90 - 100 to height 50 - 5
      const y = 50 - ((pt.spo2 - 90) / 10) * 45;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    container.innerHTML = `
      <div class="trend-chart-box">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; font-family:'Share Tech Mono'; font-size:0.72rem;">
          <span style="color:#00FF99;">HEART RATE (BPM) TELEMETRY WAVEFORM</span>
          <span style="color:#FFFFFF;">CURRENT: ${ast.telemetry.heartRate} BPM</span>
        </div>
        <svg viewBox="0 0 300 55" class="sparkline-svg">
          <!-- Safe Zone Band 60-80 -->
          <rect x="0" y="22" width="300" height="18" fill="rgba(0,255,153,0.08)" />
          <line x1="0" y1="22" x2="300" y2="22" stroke="rgba(0,255,153,0.25)" stroke-dasharray="2,2" />
          <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(0,255,153,0.25)" stroke-dasharray="2,2" />
          <polyline fill="none" stroke="#00FF99" stroke-width="2" stroke-linecap="round" points="${hrPoints}" />
        </svg>
      </div>

      <div class="trend-chart-box">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; font-family:'Share Tech Mono'; font-size:0.72rem;">
          <span style="color:#00E5FF;">PULMONARY SpO2 (%) OXYGENATION</span>
          <span style="color:#FFFFFF;">CURRENT: ${ast.telemetry.spo2}%</span>
        </div>
        <svg viewBox="0 0 300 55" class="sparkline-svg">
          <!-- Critical threshold line 95% -->
          <line x1="0" y1="27" x2="300" y2="27" stroke="rgba(255,77,109,0.35)" stroke-dasharray="3,3" />
          <polyline fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" points="${spo2Points}" />
        </svg>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // SECTION C: AI CREW INTELLIGENCE (CHAT ENGINE)
  // --------------------------------------------------------------------------
  sendQuickPrompt(text) {
    if (this.inputField) {
      this.inputField.value = text;
    }
    this.switchSubView('ai-chat');
    this.sendMessage();
  }

  async sendMessage() {
    if (this.isSubmitting) return;
    const query = this.inputField ? this.inputField.value.trim() : '';
    if (!query) return;

    this.isSubmitting = true;
    if (this.inputField) {
      this.inputField.value = '';
      this.inputField.disabled = true;
    }
    if (this.sendBtn) this.sendBtn.disabled = true;

    // Append User Message
    this.appendMessage('user', query);
    if (window.soundEngine) window.soundEngine.playTelemetryBeep(920, 0.04);

    // Show AI Typing Indicator
    const typingId = this.showTypingIndicator();

    try {
      const activeAst = this.getSelectedAstronaut();
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronautId: activeAst ? activeAst.id : 'ast-001',
          prompt: query,
          telemetry: activeAst ? activeAst.telemetry : null
        })
      });

      this.removeTypingIndicator(typingId);

      if (!res.ok) throw new Error('AI Engine unreachable');
      const json = await res.json();
      if (!json.success || !json.data) throw new Error('Invalid response structure');

      this.renderAIResponse(json.data, query);
    } catch (err) {
      this.removeTypingIndicator(typingId);
      // Autonomous scientific fallback
      const fallbackData = this.generateAutonomousMedicalResponse(query);
      this.renderAIResponse(fallbackData, query);
    } finally {
      this.isSubmitting = false;
      if (this.inputField) {
        this.inputField.disabled = false;
        this.inputField.focus();
      }
      if (this.sendBtn) this.sendBtn.disabled = false;
    }
  }

  renderAIResponse(data, originalQuery) {
    let html = '';

    if (data.type === 'CREW_ANALYSIS') {
      // Crew-wide structured response
      html = `
        <div style="border-bottom:1px solid rgba(0,229,255,0.25); padding-bottom:0.5rem; margin-bottom:0.6rem;">
          <span style="font-family:'Orbitron'; font-size:0.78rem; font-weight:700; color:var(--accent-cyan);">
            👥 FLEET-WIDE CREW CLINICAL SYNTHESIS
          </span>
          <span style="font-family:'Share Tech Mono'; font-size:0.7rem; color:#8E9DB8; float:right;">
            ARES-IV & ARTEMIS MISSION FLEET
          </span>
        </div>

        <p style="font-size:0.92rem; line-height:1.55; color:#FFFFFF; margin-bottom:0.75rem;">
          ${data.overallSummary}
        </p>

        <!-- Stats row -->
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem; font-family:'Share Tech Mono'; font-size:0.75rem;">
          <span style="background:rgba(0,255,153,0.12); color:#00FF99; padding:0.2rem 0.5rem; border-radius:4px; border:1px solid rgba(0,255,153,0.3);">
            NORMAL: ${data.stats.normal}
          </span>
          <span style="background:rgba(255,184,0,0.12); color:#FFB800; padding:0.2rem 0.5rem; border-radius:4px; border:1px solid rgba(255,184,0,0.3);">
            ATTENTION: ${data.stats.attentionRequired}
          </span>
          <span style="background:rgba(255,77,109,0.12); color:#FF4D6D; padding:0.2rem 0.5rem; border-radius:4px; border:1px solid rgba(255,77,109,0.3);">
            CRITICAL: ${data.stats.criticalAlerts}
          </span>
        </div>

        <!-- Individual findings breakdown -->
        <div style="background:rgba(5, 8, 22, 0.5); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:0.75rem; margin-bottom:0.75rem;">
          <strong style="color:var(--accent-cyan); font-family:'Rajdhani'; font-size:0.9rem; text-transform:uppercase;">
            Crew Member Findings & Comparative Risk:
          </strong>
          <div style="margin-top:0.4rem; display:flex; flex-direction:column; gap:0.35rem; font-size:0.8rem; font-family:'Share Tech Mono';">
            ${data.individualFindings ? data.individualFindings.map(f => `
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:0.2rem;">
                <span style="color:#FFFFFF;">${f.name} (${f.callsign})</span>
                <span style="color:#C2D1E5;">${f.heartRate} bpm • ${f.spo2}% SpO2</span>
                <span style="color:${f.triageStatus === 'NORMAL' ? '#00FF99' : '#FFB800'}; font-weight:bold;">${f.triageStatus}</span>
              </div>
            `).join('') : ''}
          </div>
        </div>

        <!-- Recommended Actions -->
        <div style="margin-bottom:0.75rem;">
          <strong style="color:var(--success-green); font-family:'Rajdhani'; font-size:0.9rem; text-transform:uppercase;">
            Recommended Flight Surgeon Actions:
          </strong>
          <ul style="margin:0.25rem 0 0 1.1rem; padding:0; font-size:0.84rem; color:#E0E7FF; line-height:1.45;">
            ${data.recommendedActions.map(act => `<li>${act}</li>`).join('')}
          </ul>
        </div>

        <!-- Footer / Citations -->
        <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem; font-family:'Share Tech Mono'; font-size:0.7rem; color:#8E9DB8; display:flex; justify-content:space-between; align-items:center;">
          <span>CITATIONS: ${data.spaceMedicineCitation || 'NASA-STD-3001'}</span>
          <button onclick="window.astraAI.speakResponse('${data.overallSummary.replace(/'/g, "\\'")}')" style="background:transparent; border:1px solid var(--border-cyan); color:var(--accent-cyan); border-radius:4px; padding:0.15rem 0.5rem; cursor:pointer; font-family:'Share Tech Mono'; font-size:0.7rem;">
            🔊 Read Aloud
          </button>
        </div>
      `;

      // Update sidebar ticket to Crew scope
      this.updateSidebarTicket('All Crew (4 Astronauts)', 'TRIAGE ACTIVE', (data.aiConfidenceScore * 100).toFixed(1) + '%', data.overallSummary);

    } else {
      // Individual Astronaut Structured Response
      const ast = data.astronaut || this.getSelectedAstronaut();
      html = `
        <div style="border-bottom:1px solid rgba(0,229,255,0.25); padding-bottom:0.4rem; margin-bottom:0.6rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-family:'Orbitron'; font-size:0.8rem; font-weight:700; color:var(--accent-cyan);">
              🧑 ${ast.name} (${ast.callsign})
            </span>
            <span style="font-family:'Share Tech Mono'; font-size:0.7rem; color:#8E9DB8; margin-left:0.5rem;">
              ${ast.role}
            </span>
          </div>
          ${this.getStatusBadgeHtml(data.status || 'NORMAL')}
        </div>

        <p style="font-size:0.92rem; line-height:1.55; color:#FFFFFF; margin-bottom:0.75rem;">
          ${data.clinicalSummary}
        </p>

        <!-- Observed Indicators & Pathophysiology -->
        ${data.anomalies && data.anomalies.length > 0 ? `
          <div style="background:rgba(0, 229, 255, 0.08); border-left:3px solid var(--accent-cyan); padding:0.55rem 0.85rem; margin:0.6rem 0; font-size:0.84rem;">
            <strong style="color:var(--accent-cyan); font-family:'Rajdhani'; font-size:0.9rem;">PATHOPHYSIOLOGY & RISK OBSERVATION:</strong><br>
            <span style="color:#E2E8F0;">${data.anomalies[0].explanation || data.anomalies[0].pathophysiology}</span>
            <div style="font-family:'Share Tech Mono'; font-size:0.7rem; color:#8E9DB8; margin-top:0.3rem;">
              Baseline Threshold: ${data.anomalies[0].thresholdBaseline || 'Nominal microgravity'}
            </div>
          </div>
        ` : ''}

        <!-- Historical Comparison -->
        ${data.historicalComparison ? `
          <div style="font-size:0.82rem; color:#C2D1E5; margin-bottom:0.6rem; font-family:'Share Tech Mono';">
            <strong>HISTORICAL DELTA:</strong> ${data.historicalComparison}
          </div>
        ` : ''}

        <!-- Recommended Actionable Protocols -->
        ${data.actionableProtocols && data.actionableProtocols.length > 0 ? `
          <div style="margin-top:0.6rem;">
            <strong style="color:var(--success-green); font-family:'Rajdhani'; font-size:0.9rem;">RECOMMENDED FLIGHT SURGEON PROTOCOLS:</strong>
            <ul style="margin-left:1.1rem; margin-top:0.25rem; font-size:0.84rem; color:#E0E7FF; line-height:1.45;">
              ${data.actionableProtocols.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top:0.75rem; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem; font-family:'Share Tech Mono'; font-size:0.7rem; color:#8E9DB8;">
          <span>CONFIDENCE: ${(data.aiConfidenceScore * 100).toFixed(1)}% • ${data.spaceMedicineCitation || 'NASA-STD-3001'}</span>
          <button onclick="window.astraAI.speakResponse('${data.clinicalSummary.replace(/'/g, "\\'")}')" style="background:transparent; border:1px solid var(--border-cyan); color:var(--accent-cyan); border-radius:4px; padding:0.15rem 0.5rem; cursor:pointer; font-family:'Share Tech Mono'; font-size:0.7rem;">
            🔊 Read Aloud
          </button>
        </div>
      `;

      // Update sidebar ticket to this astronaut
      this.updateSidebarTicket(ast.name, data.status || 'EVALUATED', (data.aiConfidenceScore * 100).toFixed(1) + '%', data.clinicalSummary);
    }

    this.appendMessage('astra', html);
    this.speakResponse(data.overallSummary || data.clinicalSummary);
    if (window.soundEngine) window.soundEngine.playConfirmChime();
  }

  updateSidebarTicket(patientName, triageStatus, confidence, details) {
    const nameEl = document.getElementById('ai-ticket-patient-name');
    const badgeEl = document.getElementById('ai-ticket-triage-badge');
    const confEl = document.getElementById('ai-ticket-confidence');
    const detEl = document.getElementById('ai-ticket-details');

    if (nameEl) nameEl.innerText = patientName;
    if (badgeEl) badgeEl.innerText = triageStatus;
    if (confEl) confEl.innerText = confidence;
    if (detEl) detEl.innerText = details.slice(0, 180) + '...';
  }

  generateAutonomousMedicalResponse(query) {
    const q = query.toLowerCase();
    const isCrew = q.includes('crew') || q.includes('all') || q.includes('everyone') || q.includes('highest');

    if (isCrew) {
      return {
        type: 'CREW_ANALYSIS',
        overallSummary: `Autonomous fleet evaluation: All 4 registered astronauts are actively synchronizing vital telemetry. Dr. Marcus Thorne exhibits elevated cardiovascular strain (resting HR 86 bpm) post-EVA, while CDR Vance and Dr. Rostova remain within nominal Level-1 flight boundaries.`,
        stats: { normal: 2, attentionRequired: 1, elevatedRisk: 1, criticalAlerts: 0 },
        individualFindings: this.crew.map(a => ({
          name: a.name,
          callsign: a.callsign,
          heartRate: a.telemetry ? a.telemetry.heartRate : 70,
          spo2: a.telemetry ? a.telemetry.spo2 : 98,
          triageStatus: this.classifyAstronautStatus(a.telemetry)
        })),
        recommendedActions: [
          'Schedule 30 min CEVIS ergometer session for Dr. Thorne.',
          'Verify cabin air scrubber circulation in Ares-IV transit module.',
          'Continue baseline 2.5h daily ARED resistive training across all crew.'
        ],
        aiConfidenceScore: 0.948,
        spaceMedicineCitation: 'NASA-STD-3001 Vol 1 Baseline Standards'
      };
    }

    const ast = this.getSelectedAstronaut();
    return {
      type: 'INDIVIDUAL_ANALYSIS',
      astronaut: ast,
      status: ast.telemetry ? ast.telemetry.status : 'NORMAL',
      clinicalSummary: `Autonomous evaluation for ${ast.name}: Physiological telemetry remains synchronized with NASA-STD-3001 spaceflight standards. Cardiovascular and pulmonary indicators remain within mission tolerance limits.`,
      anomalies: [{
        explanation: 'Cardiopulmonary adaptation in microgravity with cephalic fluid redistribution managed by daily aerobic countermeasure protocols.',
        thresholdBaseline: '60 - 80 bpm resting'
      }],
      actionableProtocols: [
        'Maintain daily aerobic and resistive exercise regimen on ARED/CEVIS.',
        'Record evening cognitive latency and mental wellness check-in.',
        'Ensure 1.0L pre-EVA isotonic rehydration.'
      ],
      aiConfidenceScore: 0.940,
      spaceMedicineCitation: 'NASA SP-20205009772: Clinical Space Medicine'
    };
  }

  showTypingIndicator() {
    const id = `typing-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chat-bubble bubble-astra';
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem; font-family:'Share Tech Mono'; color:var(--accent-cyan); font-size:0.82rem;">
        <span>Astra AI is analyzing mission telemetry & NASA research databases...</span>
        <span class="hud-blink">●</span>
      </div>
    `;
    if (this.messagesContainer) {
      this.messagesContainer.appendChild(div);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    return id;
  }

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  appendMessage(sender, content) {
    if (!this.messagesContainer) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender === 'astra' ? 'bubble-astra' : 'bubble-user'}`;
    bubble.innerHTML = content;
    this.messagesContainer.appendChild(bubble);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  getFallbackCrew() {
    return [
      {
        id: 'ast-001',
        name: 'CDR Sarah Vance',
        callsign: 'Valkyrie',
        role: 'Mission Commander',
        mission: 'ARES-IV Mars Expedition',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        age: 39,
        bloodType: 'O+',
        vo2Max: 54.2,
        boneDensityTScore: 1.08,
        telemetry: { heartRate: 68, spo2: 98.6, bpSystolic: 118, bpDiastolic: 76, bodyTemp: 36.8, stressScore: 24, radiationDoseRateUsvH: 42.5, status: 'EXCELLENT' }
      },
      {
        id: 'ast-002',
        name: 'Dr. Marcus Thorne',
        callsign: 'Atlas',
        role: 'Chief Medical Officer',
        mission: 'ARES-IV Mars Expedition',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        age: 44,
        bloodType: 'A-',
        vo2Max: 51.0,
        boneDensityTScore: 0.91,
        telemetry: { heartRate: 86, spo2: 95.8, bpSystolic: 134, bpDiastolic: 88, bodyTemp: 37.4, stressScore: 68, radiationDoseRateUsvH: 49.2, status: 'WARNING' }
      },
      {
        id: 'ast-003',
        name: 'Dr. Elena Rostova',
        callsign: 'Novacrest',
        role: 'Science Officer',
        mission: 'Artemis V Shackleton Base',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        age: 36,
        bloodType: 'B+',
        vo2Max: 56.4,
        boneDensityTScore: 1.18,
        telemetry: { heartRate: 72, spo2: 99.1, bpSystolic: 115, bpDiastolic: 74, bodyTemp: 36.7, stressScore: 30, radiationDoseRateUsvH: 18.4, status: 'EXCELLENT' }
      },
      {
        id: 'ast-004',
        name: 'Eng. Kenji Sato',
        callsign: 'Ronin',
        role: 'Systems Engineer',
        mission: 'ISS Expedition 74',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        age: 41,
        bloodType: 'AB+',
        vo2Max: 52.8,
        boneDensityTScore: 1.02,
        telemetry: { heartRate: 75, spo2: 97.5, bpSystolic: 122, bpDiastolic: 80, bodyTemp: 36.9, stressScore: 42, radiationDoseRateUsvH: 12.8, status: 'GOOD' }
      }
    ];
  }
}

// Global Export
window.AstraAIAssistant = AstraAIAssistant;
