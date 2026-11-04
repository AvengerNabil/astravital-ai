// ==============================================================================
// AstraVital AI - Data Provenance & Scientific Integrity Center
// NASA Space Apps Challenge 2026
// Distinguishes: Real Research Data vs Simulated Telemetry vs Derived Analytics
// ==============================================================================

class DataProvenanceManager {
  constructor() {
    this.provenanceData = null;
    this.activeFilter = 'ALL';
    this.init();
  }

  async init() {
    await this.fetchProvenance();
    this.renderCategoryCards();
    this.renderDictionaryTable();
    this.setupListeners();
  }

  async fetchProvenance() {
    try {
      const res = await fetch('/api/provenance');
      const json = await res.json();
      if (json.success) {
        this.provenanceData = json.data;
      }
    } catch (e) {
      console.warn('Failed to load provenance data:', e);
    }
  }

  setupListeners() {
    document.querySelectorAll('.prov-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.prov-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.renderDictionaryTable();
      });
    });
  }

  renderCategoryCards() {
    const container = document.getElementById('provenance-category-cards');
    if (!container || !this.provenanceData) return;

    const cats = this.provenanceData.categories;
    container.innerHTML = `
      <!-- Real Research Data Card -->
      <div class="glass-panel cyber-corners prov-card prov-real">
        <div class="prov-card-header">
          <span class="prov-badge badge-real-research">🟢 REAL RESEARCH DATA</span>
        </div>
        <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:#10B981;">Authentic NASA Research Repositories</h3>
        <p style="font-size:0.86rem; color:#CBD5E1; line-height:1.5; margin-bottom:0.85rem;">
          ${cats.REAL_RESEARCH_DATA.description}
        </p>
        <div class="prov-box" style="border-left: 3px solid #10B981; background:rgba(16,185,129,0.08);">
          <strong style="color:#10B981; font-size:0.8rem; display:block; margin-bottom:0.2rem;">VERIFICATION & ACCESSION:</strong>
          <span style="font-size:0.8rem; color:#94A3B8;">${cats.REAL_RESEARCH_DATA.verification}</span>
        </div>
      </div>

      <!-- Simulated Telemetry Card -->
      <div class="glass-panel cyber-corners prov-card prov-sim">
        <div class="prov-card-header">
          <span class="prov-badge badge-simulated-telemetry">🟡 SIMULATED TELEMETRY</span>
        </div>
        <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:#F59E0B;">Continuous Biosensor Simulation</h3>
        <p style="font-size:0.86rem; color:#CBD5E1; line-height:1.5; margin-bottom:0.85rem;">
          ${cats.SIMULATED_TELEMETRY.description}
        </p>
        <div class="prov-box" style="border-left: 3px solid #F59E0B; background:rgba(245,158,11,0.08);">
          <strong style="color:#F59E0B; font-size:0.8rem; display:block; margin-bottom:0.2rem;">TRANSPARENCY NOTICE:</strong>
          <span style="font-size:0.8rem; color:#94A3B8;">${cats.SIMULATED_TELEMETRY.verification}</span>
        </div>
      </div>

      <!-- Derived Analytical Data Card -->
      <div class="glass-panel cyber-corners prov-card prov-derived">
        <div class="prov-card-header">
          <span class="prov-badge badge-derived-analytics">🟣 DERIVED ANALYTICAL DATA</span>
        </div>
        <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:#8B5CF6;">AI Risk Inference & Digital Twin</h3>
        <p style="font-size:0.86rem; color:#CBD5E1; line-height:1.5; margin-bottom:0.85rem;">
          ${cats.DERIVED_ANALYTICAL_DATA.description}
        </p>
        <div class="prov-box" style="border-left: 3px solid #8B5CF6; background:rgba(139,92,246,0.08);">
          <strong style="color:#8B5CF6; font-size:0.8rem; display:block; margin-bottom:0.2rem;">ALGORITHMIC BASIS:</strong>
          <span style="font-size:0.8rem; color:#94A3B8;">${cats.DERIVED_ANALYTICAL_DATA.verification}</span>
        </div>
      </div>
    `;
  }

  renderDictionaryTable() {
    const tbody = document.getElementById('provenance-dictionary-tbody');
    if (!tbody || !this.provenanceData) return;

    let items = [...this.provenanceData.telemetryDictionary];
    if (this.activeFilter !== 'ALL') {
      items = items.filter(i => i.classification.toUpperCase().includes(this.activeFilter.toUpperCase()));
    }

    tbody.innerHTML = items.map(item => {
      let badgeClass = 'badge-simulated-telemetry';
      if (item.classification.includes('REAL')) badgeClass = 'badge-real-research';
      else if (item.classification.includes('DERIVED')) badgeClass = 'badge-derived-analytics';

      return `
        <tr>
          <td>
            <strong>${item.parameter}</strong>
            <div style="font-family:'Share Tech Mono'; font-size:0.75rem; color:#546481;">key: ${item.key}</div>
          </td>
          <td>
            <span class="prov-badge ${badgeClass}">${item.classification}</span>
          </td>
          <td style="font-family:'Share Tech Mono'; font-size:0.85rem; color:#E2E8F0;">${item.unit}</td>
          <td style="font-size:0.82rem; color:#8E9DB8;">${item.nominalRange}</td>
          <td style="font-size:0.82rem; color:#CBD5E1;">${item.sourceType}</td>
          <td>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              ${item.linkedResearch.map(r => `<span class="badge-research-id" style="font-size:0.7rem;">${r}</span>`).join('')}
            </div>
          </td>
          <td style="font-size:0.78rem; color:#8E9DB8; line-height:1.4;">${item.limitations}</td>
        </tr>
      `;
    }).join('');
  }
}

window.DataProvenanceManager = DataProvenanceManager;

