// ==============================================================================
// AstraVital AI - NASA Research Explorer & NTRS Library Controller
// NASA Space Apps Challenge 2026
// Integrates: NASA Open Science Data Repository (OSDR), GeneLab, and NTRS
// ==============================================================================

class NasaResearchManager {
  constructor() {
    this.osdrStudies = [];
    this.ntrsPublications = [];
    this.activeOsdrFilter = 'ALL';
    this.activeNtrsFilter = 'ALL';
    this.currentSearchTerm = '';

    this.init();
  }

  async init() {
    await this.loadOsdrStudies();
    await this.loadNtrsPublications();
    this.setupEventListeners();
    this.renderOsdrExplorer();
    this.renderNtrsLibrary();
  }

  async loadOsdrStudies(category = 'ALL', term = '') {
    try {
      let url = '/api/nasa/osdr?';
      if (category && category !== 'ALL') url += `category=${encodeURIComponent(category)}&`;
      if (term) url += `term=${encodeURIComponent(term)}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        this.osdrStudies = json.data;
      }
    } catch (e) {
      console.warn('Failed to load OSDR studies from server:', e);
    }
  }

  async loadNtrsPublications(category = 'ALL', q = '') {
    try {
      let url = '/api/nasa/ntrs?';
      if (category && category !== 'ALL') url += `category=${encodeURIComponent(category)}&`;
      if (q) url += `q=${encodeURIComponent(q)}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        this.ntrsPublications = json.data;
      }
    } catch (e) {
      console.warn('Failed to load NTRS publications from server:', e);
    }
  }

  setupEventListeners() {
    // OSDR Search & Filters
    const osdrSearch = document.getElementById('osdr-search-input');
    if (osdrSearch) {
      osdrSearch.addEventListener('input', (e) => {
        this.loadOsdrStudies(this.activeOsdrFilter, e.target.value).then(() => {
          this.renderOsdrExplorer();
        });
      });
    }

    document.querySelectorAll('.osdr-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.osdr-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeOsdrFilter = btn.dataset.filter;
        const term = osdrSearch ? osdrSearch.value : '';
        this.loadOsdrStudies(this.activeOsdrFilter, term).then(() => {
          this.renderOsdrExplorer();
        });
      });
    });

    // NTRS Search & Filters
    const ntrsSearch = document.getElementById('ntrs-search-input');
    if (ntrsSearch) {
      ntrsSearch.addEventListener('input', (e) => {
        this.loadNtrsPublications(this.activeNtrsFilter, e.target.value).then(() => {
          this.renderNtrsLibrary();
        });
      });
    }

    document.querySelectorAll('.ntrs-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ntrs-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeNtrsFilter = btn.dataset.filter;
        const q = ntrsSearch ? ntrsSearch.value : '';
        this.loadNtrsPublications(this.activeNtrsFilter, q).then(() => {
          this.renderNtrsLibrary();
        });
      });
    });
  }

  renderOsdrExplorer() {
    const container = document.getElementById('osdr-cards-container');
    const countEl = document.getElementById('osdr-studies-count');
    if (!container) return;

    if (countEl) countEl.innerText = `${this.osdrStudies.length} Studies`;

    if (this.osdrStudies.length === 0) {
      container.innerHTML = `
        <div class="glass-panel" style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #8E9DB8;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
          <div>No NASA OSDR studies match your active query.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.osdrStudies.map(study => `
      <div class="glass-panel cyber-corners research-card" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="badge-research-id">${study.studyId}</span>
              ${study.legacyId ? `<span class="badge-subtle">${study.legacyId}</span>` : ''}
            </div>
            <span class="badge-provenance-real">REAL RESEARCH DATA</span>
          </div>

          <h3 style="font-size:1.05rem; line-height:1.4; margin-bottom:0.6rem; color:#fff;">
            ${study.title}
          </h3>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem; font-size:0.75rem;">
            <span class="meta-tag">🧬 ${study.organism}</span>
            <span class="meta-tag">🚀 ${study.spacecraft}</span>
            <span class="meta-tag">🔬 ${study.assayType}</span>
          </div>

          <p style="font-size:0.84rem; color:#8E9DB8; line-height:1.5; margin-bottom:0.85rem;">
            ${study.description}
          </p>

          <div class="research-key-finding-box">
            <strong style="color:var(--accent-cyan); display:block; margin-bottom:0.25rem;">KEY BIOLOGICAL FINDING:</strong>
            <span style="font-size:0.82rem; color:#E2E8F0;">${study.keyFindings}</span>
          </div>
        </div>

        <div style="margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <span style="font-family:'Share Tech Mono'; font-size:0.75rem; color:#546481;">
            DOI: ${study.doi}
          </span>
          <a href="${study.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn-research-link">
            Open in NASA OSDR ↗
          </a>
        </div>
      </div>
    `).join('');
  }

  renderNtrsLibrary() {
    const container = document.getElementById('ntrs-cards-container');
    const countEl = document.getElementById('ntrs-reports-count');
    if (!container) return;

    if (countEl) countEl.innerText = `${this.ntrsPublications.length} Technical Reports`;

    if (this.ntrsPublications.length === 0) {
      container.innerHTML = `
        <div class="glass-panel" style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #8E9DB8;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📚</div>
          <div>No NASA NTRS publications match your active filter.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.ntrsPublications.map(pub => `
      <div class="glass-panel cyber-corners research-card" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="badge-research-id">${pub.reportId}</span>
              <span class="badge-subtle">${pub.category}</span>
            </div>
            <span class="badge-provenance-real">REAL RESEARCH DATA</span>
          </div>

          <h3 style="font-size:1.05rem; line-height:1.4; margin-bottom:0.4rem; color:#fff;">
            ${pub.title}
          </h3>

          <div style="font-size:0.78rem; color:#8E9DB8; margin-bottom:0.75rem; font-family:'Share Tech Mono';">
            👤 ${pub.authors} (${pub.publicationDate.split('-')[0]}) • ${pub.organization}
          </div>

          <p style="font-size:0.84rem; color:#8E9DB8; line-height:1.5; margin-bottom:0.85rem;">
            ${pub.abstract}
          </p>

          ${pub.keyPoints ? `
            <div class="research-key-finding-box" style="background:rgba(139,92,246,0.08); border-left-color:var(--accent-purple);">
              <strong style="color:var(--accent-purple); display:block; margin-bottom:0.25rem;">CLINICAL & MISSION TAKEAWAYS:</strong>
              <ul style="margin:0; padding-left:1.1rem; font-size:0.8rem; color:#E2E8F0;">
                ${pub.keyPoints.map(kp => `<li style="margin-bottom:0.25rem;">${kp}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <div style="margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <span style="font-family:'Share Tech Mono'; font-size:0.72rem; color:#546481;">
            NASA NTRS Doc ID: ${pub.documentId}
          </span>
          <a href="${pub.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn-research-link">
            View at NASA NTRS ↗
          </a>
        </div>
      </div>
    `).join('');
  }

  // Opens research-to-dashboard connection modal for any clicked vital parameter
  showResearchModalForMetric(metricKey, metricLabel, currentValue, unit) {
    const modal = document.getElementById('research-context-modal');
    if (!modal) return;

    const titleEl = document.getElementById('rc-modal-title');
    const badgeEl = document.getElementById('rc-modal-badge');
    const metricValEl = document.getElementById('rc-modal-metric-val');
    const osdrListEl = document.getElementById('rc-modal-osdr-list');
    const ntrsListEl = document.getElementById('rc-modal-ntrs-list');
    const explanationEl = document.getElementById('rc-modal-explanation');

    if (titleEl) titleEl.innerText = `NASA Research Context: ${metricLabel}`;
    if (metricValEl) metricValEl.innerText = `${currentValue} ${unit}`;

    // Filter matching OSDR studies
    const matchingOsdr = this.osdrStudies.filter(s =>
      s.linkedIndicators && s.linkedIndicators.includes(metricKey)
    );

    // Filter matching NTRS publications
    const matchingNtrs = this.ntrsPublications.filter(p =>
      p.linkedIndicators && p.linkedIndicators.includes(metricKey)
    );

    // Render OSDR studies inside modal
    if (osdrListEl) {
      if (matchingOsdr.length > 0) {
        osdrListEl.innerHTML = matchingOsdr.map(s => `
          <div class="rc-item">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
              <strong style="color:var(--accent-cyan); font-size:0.9rem;">${s.studyId} - ${s.title}</strong>
              <span class="badge-provenance-real" style="font-size:0.65rem;">REAL RESEARCH DATA</span>
            </div>
            <p style="font-size:0.8rem; color:#8E9DB8; margin-bottom:0.35rem;">${s.description}</p>
            <div style="font-size:0.78rem; color:#CBD5E1; margin-bottom:0.35rem;">
              <strong>Finding:</strong> ${s.keyFindings}
            </div>
            <a href="${s.officialUrl}" target="_blank" rel="noopener noreferrer" style="font-size:0.75rem; color:var(--accent-cyan); text-decoration:underline;">
              Open official study in NASA OSDR ↗
            </a>
          </div>
        `).join('');
      } else {
        osdrListEl.innerHTML = `<div style="font-size:0.85rem; color:#8E9DB8;">No specific OSDR genomics study linked. Reference general human research standards.</div>`;
      }
    }

    // Render NTRS publications inside modal
    if (ntrsListEl) {
      if (matchingNtrs.length > 0) {
        ntrsListEl.innerHTML = matchingNtrs.map(p => `
          <div class="rc-item">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
              <strong style="color:var(--accent-purple); font-size:0.9rem;">${p.reportId} - ${p.title}</strong>
              <span class="badge-provenance-real" style="font-size:0.65rem;">REAL RESEARCH DATA</span>
            </div>
            <p style="font-size:0.8rem; color:#8E9DB8; margin-bottom:0.35rem;">${p.abstract}</p>
            <div style="font-size:0.78rem; color:#CBD5E1; margin-bottom:0.35rem;">
              <strong>Authors:</strong> ${p.authors} (${p.publicationDate})
            </div>
            <a href="${p.officialUrl}" target="_blank" rel="noopener noreferrer" style="font-size:0.75rem; color:var(--accent-purple); text-decoration:underline;">
              View full report on NASA Technical Reports Server ↗
            </a>
          </div>
        `).join('');
      } else {
        ntrsListEl.innerHTML = `<div style="font-size:0.85rem; color:#8E9DB8;">See NASA-STD-3001 Vol 1 for medical baseline standards.</div>`;
      }
    }

    // Explanation
    if (explanationEl) {
      explanationEl.innerHTML = `
        <div style="font-size:0.85rem; line-height:1.5; color:#CBD5E1;">
          <strong>Scientific Integrity Notice:</strong> The observation above is generated by AstraVital's simulated telemetry engine. The studies and reports displayed here represent authentic peer-reviewed NASA research establishing the clinical and physiological baseline for understanding this parameter during human spaceflight.
        </div>
      `;
    }

    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('research-context-modal');
    if (modal) modal.classList.remove('active');
  }
}

window.NasaResearchManager = NasaResearchManager;

