// ==============================================================================
// AstraVital AI - 3D Digital Twin System (Three.js)
// NASA Space Apps Challenge 2026
// Enhanced with Dynamic Telemetry Coupling and Authentic NASA Research Links
// ==============================================================================

class DigitalTwinVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mannequinGroup = null;
    this.hotspots = [];
    this.selectedHotspot = 'cardiac';

    this.hotspotData = {
      brain: {
        title: 'Cerebrovascular & Neuro-Vestibular (SANS)',
        organ: 'Brain & Optic Nerve Sheath',
        stressPct: 46,
        status: 'MONITORED',
        color: '#7B61FF',
        findings: 'Optic nerve sheath diameter: 5.8mm (slight distension). Cephalad fluid shift has increased intracranial venous pressure by +12%. Vestibular adaptation complete.',
        countermeasure: 'Apply Lower Body Negative Pressure (LBNP) for 45 min at -25 mmHg; optical coherence tomography scan in 48 hours.',
        linkedStudies: ['OSD-473', 'OSD-205'],
        linkedReports: ['NASA/TM-20210018042', 'NASA/TP-2020-5002995'],
        provenance: 'DERIVED ANALYTICAL DATA (SANS Bio-Hemodynamic Model)'
      },
      cardiac: {
        title: 'Cardiovascular Hemodynamics & Left Ventricle',
        organ: 'Left Ventricle & Myocardium',
        stressPct: 58,
        status: 'ELEVATED WORKLOAD',
        color: '#FF4D6D',
        findings: 'Resting cardiac output elevated. Stroke volume down 8% due to blood volume contraction in microgravity. Left ventricular mass reduction risk index: Moderate.',
        countermeasure: 'Prescribe 35 min on Cycle Ergometer with Vibration Isolation (CEVIS) at 75% VO2 peak, with 1.2L isotonic fluid loading prior to EVA.',
        linkedStudies: ['OSD-205', 'OSD-665', 'OSD-612'],
        linkedReports: ['NASA/TM-2018-219801', 'NASA/SP-20205009772'],
        provenance: 'DERIVED ANALYTICAL DATA (Coupled to Live HR & BP Telemetry)'
      },
      lungs: {
        title: 'Pulmonary Ventilation & Gas Exchange',
        organ: 'Bronchial & Alveolar Tree',
        stressPct: 24,
        status: 'NOMINAL',
        color: '#00E5FF',
        findings: 'SpO2 stable at 98.2%. Ventilation-perfusion matching optimal. No micro-particulate lunar dust inhalation signs detected.',
        countermeasure: 'Maintain standard cabin partial oxygen at 21.0% (34.0 kPa total pressure).',
        linkedStudies: ['OSD-379'],
        linkedReports: ['NASA-STD-3001-VOL-1'],
        provenance: 'DERIVED ANALYTICAL DATA (Coupled to Live SpO2 Telemetry)'
      },
      spine: {
        title: 'Axial Spine & Intervertebral Discs',
        organ: 'Lumbar & Thoracic Spine',
        stressPct: 64,
        status: 'DEGENERATION RISK',
        color: '#FFB800',
        findings: 'Spinal height elongated by +4.2 cm due to disc hydration in microgravity. Paraspinal muscle cross-sectional area decreased by 6.4%. Back pain score: 3/10.',
        countermeasure: 'Deploy Skinsuit compressive axial loading garment (0.8G equivalent); 20 min core stabilization exercises on ARED.',
        linkedStudies: ['OSD-120'],
        linkedReports: ['NASA/TP-2015-218575'],
        provenance: 'DERIVED ANALYTICAL DATA (Biomechanical Spinal Elongation Index)'
      },
      femur: {
        title: 'Femoral Trabecular Bone Demineralization',
        organ: 'Femoral Neck & Cortical Bone',
        stressPct: 54,
        status: 'PROGRESSIVE LOSS',
        color: '#FFB800',
        findings: 'Bone mineral resorption rate: 1.15% per 30 days in microgravity. Urinary calcium excretion elevated (+22%).',
        countermeasure: 'Administer intravenous zoledronic acid booster; maintain daily 200kg deadlift loads on Advanced Resistive Exercise Device (ARED).',
        linkedStudies: ['OSD-563', 'OSD-120'],
        linkedReports: ['NASA/TP-2015-218575'],
        provenance: 'DERIVED ANALYTICAL DATA (NASA HRP Bone Mineral Loss Model)'
      }
    };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 550;
    const height = this.container.clientHeight || 520;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.2, 5.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Ambient & Accent Lights
    const amb = new THREE.AmbientLight(0x0b1026, 2.0);
    this.scene.add(amb);

    const cyanPoint = new THREE.PointLight(0x00e5ff, 2.5, 30);
    cyanPoint.position.set(3, 4, 4);
    this.scene.add(cyanPoint);

    const purplePoint = new THREE.PointLight(0x7b61ff, 2.0, 30);
    purplePoint.position.set(-3, -2, 3);
    this.scene.add(purplePoint);

    // Build Hologram Mannequin & Hotspots
    this.createHolographicMannequin();
    this.setupHotspots();

    // Event listeners
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.setupInteractions();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Initial render of default hotspot
    this.selectHotspot('cardiac');
  }

  createHolographicMannequin() {
    this.mannequinGroup = new THREE.Group();

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    // 1. Head
    const headGeom = new THREE.SphereGeometry(0.38, 24, 24);
    const headMesh = new THREE.Mesh(headGeom, wireMat);
    headMesh.position.y = 2.1;
    this.mannequinGroup.add(headMesh);

    // Visor HUD ring
    const visorGeom = new THREE.TorusGeometry(0.34, 0.04, 16, 32, Math.PI);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x7b61ff });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 2.1, 0.15);
    this.mannequinGroup.add(visor);

    // 2. Neck
    const neckGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.22, 16);
    const neck = new THREE.Mesh(neckGeom, wireMat);
    neck.position.y = 1.74;
    this.mannequinGroup.add(neck);

    // 3. Chest / Torso
    const chestGeom = new THREE.CylinderGeometry(0.55, 0.42, 1.0, 20);
    const chest = new THREE.Mesh(chestGeom, wireMat);
    chest.position.y = 1.15;
    this.mannequinGroup.add(chest);

    // 4. Abdomen & Pelvis
    const pelvisGeom = new THREE.CylinderGeometry(0.42, 0.48, 0.55, 20);
    const pelvis = new THREE.Mesh(pelvisGeom, wireMat);
    pelvis.position.y = 0.45;
    this.mannequinGroup.add(pelvis);

    // 5. Arms (Left & Right)
    [-1, 1].forEach(side => {
      const shoulderGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const shoulder = new THREE.Mesh(shoulderGeom, wireMat);
      shoulder.position.set(side * 0.72, 1.5, 0);
      this.mannequinGroup.add(shoulder);

      const upperArmGeom = new THREE.CylinderGeometry(0.14, 0.12, 0.7, 16);
      const upperArm = new THREE.Mesh(upperArmGeom, wireMat);
      upperArm.position.set(side * 0.78, 1.05, 0);
      this.mannequinGroup.add(upperArm);

      const forearmGeom = new THREE.CylinderGeometry(0.11, 0.09, 0.65, 16);
      const forearm = new THREE.Mesh(forearmGeom, wireMat);
      forearm.position.set(side * 0.82, 0.4, 0.1);
      this.mannequinGroup.add(forearm);
    });

    // 6. Legs (Left & Right)
    [-1, 1].forEach(side => {
      const hipGeom = new THREE.SphereGeometry(0.2, 16, 16);
      const hip = new THREE.Mesh(hipGeom, wireMat);
      hip.position.set(side * 0.32, 0.18, 0);
      this.mannequinGroup.add(hip);

      const thighGeom = new THREE.CylinderGeometry(0.18, 0.14, 1.1, 16);
      const thigh = new THREE.Mesh(thighGeom, wireMat);
      thigh.position.set(side * 0.34, -0.45, 0);
      this.mannequinGroup.add(thigh);

      const kneeGeom = new THREE.SphereGeometry(0.14, 16, 16);
      const knee = new THREE.Mesh(kneeGeom, wireMat);
      knee.position.set(side * 0.34, -1.05, 0);
      this.mannequinGroup.add(knee);

      const calfGeom = new THREE.CylinderGeometry(0.13, 0.10, 1.0, 16);
      const calf = new THREE.Mesh(calfGeom, wireMat);
      calf.position.set(side * 0.34, -1.6, 0);
      this.mannequinGroup.add(calf);
    });

    // Hologram Pedestal Ring
    const ringGeom = new THREE.RingGeometry(1.4, 1.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const pedestal = new THREE.Mesh(ringGeom, ringMat);
    pedestal.rotation.x = Math.PI / 2;
    pedestal.position.y = -2.2;
    this.mannequinGroup.add(pedestal);

    this.scene.add(this.mannequinGroup);
  }

  setupHotspots() {
    const points = [
      { id: 'brain', pos: [0, 2.1, 0.4], color: 0x7b61ff },
      { id: 'cardiac', pos: [-0.15, 1.25, 0.45], color: 0xff4d6d },
      { id: 'lungs', pos: [0.18, 1.25, 0.45], color: 0x00e5ff },
      { id: 'spine', pos: [0, 0.8, -0.3], color: 0xffb800 },
      { id: 'femur', pos: [0.35, -0.45, 0.3], color: 0xffb800 }
    ];

    points.forEach(pt => {
      const geom = new THREE.SphereGeometry(0.08, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: pt.color });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(...pt.pos);
      mesh.userData = { id: pt.id };

      // Pulsing glow ring
      const ringGeom = new THREE.RingGeometry(0.1, 0.14, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pt.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(...pt.pos);
      mesh.userData.ring = ring;

      this.mannequinGroup.add(mesh);
      this.mannequinGroup.add(ring);
      this.hotspots.push(mesh);
    });
  }

  setupInteractions() {
    const dom = this.renderer.domElement;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    dom.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.mannequinGroup) return;
      const dx = e.clientX - prevMouse.x;
      this.mannequinGroup.rotation.y += dx * 0.008;
      prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    // Touch controls
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    dom.addEventListener('touchmove', (e) => {
      if (isDragging && this.mannequinGroup && e.touches.length === 1) {
        const dx = e.touches[0].clientX - prevMouse.x;
        this.mannequinGroup.rotation.y += dx * 0.008;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchend', () => { isDragging = false; });
  }

  selectHotspot(hotspotId) {
    this.selectedHotspot = hotspotId;
    const data = this.hotspotData[hotspotId];
    if (!data) return;

    if (window.soundEngine) {
      window.soundEngine.playTelemetryBeep(1100, 0.05);
    }

    // Update active UI buttons
    document.querySelectorAll('.hotspot-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hotspot === hotspotId);
    });

    // Update clinical panel text
    const titleEl = document.getElementById('twin-panel-title');
    const organEl = document.getElementById('twin-organ-name');
    const stressEl = document.getElementById('twin-stress-bar');
    const stressValEl = document.getElementById('twin-stress-val');
    const findingsEl = document.getElementById('twin-findings');
    const counterEl = document.getElementById('twin-countermeasure');
    const provenanceEl = document.getElementById('twin-provenance-badge');
    const researchBtnContainer = document.getElementById('twin-research-action-container');

    if (titleEl) titleEl.innerText = data.title;
    if (organEl) organEl.innerText = data.organ;
    if (stressValEl) stressValEl.innerText = `${data.stressPct}% STRESS INDEX`;
    if (stressEl) {
      stressEl.style.width = `${data.stressPct}%`;
      stressEl.style.background = data.color;
    }
    if (findingsEl) findingsEl.innerText = data.findings;
    if (counterEl) counterEl.innerText = data.countermeasure;

    if (provenanceEl) {
      provenanceEl.innerText = data.provenance || 'DERIVED ANALYTICAL DATA';
    }

    if (researchBtnContainer) {
      researchBtnContainer.innerHTML = `
        <button class="btn-research-link" style="width:100%; justify-content:center; padding:0.6rem;" onclick="window.app.showOrganResearchContext('${hotspotId}')">
          🔬 View NASA Research Citations (${data.linkedStudies.join(', ')}) ↗
        </button>
      `;
    }

    // Smoothly focus camera towards anatomical level
    let targetY = 1.2;
    if (hotspotId === 'brain') targetY = 2.1;
    else if (hotspotId === 'cardiac' || hotspotId === 'lungs') targetY = 1.3;
    else if (hotspotId === 'spine') targetY = 0.8;
    else if (hotspotId === 'femur') targetY = -0.1;

    gsap.to(this.camera.position, { y: targetY, z: 4.8, duration: 1.0, ease: 'power2.out' });
  }

  // Synchronizes live organ stress calculations with incoming simulated telemetry
  updateTelemetry(telemetry, digitalTwin) {
    if (!telemetry) return;

    // Cardiac stress coupled to HR & BP
    if (this.hotspotData.cardiac) {
      const hrStress = Math.min(100, Math.max(15, Math.round((telemetry.heartRate - 50) * 1.1)));
      this.hotspotData.cardiac.stressPct = hrStress;
      if (this.selectedHotspot === 'cardiac') {
        const stressValEl = document.getElementById('twin-stress-val');
        const stressEl = document.getElementById('twin-stress-bar');
        if (stressValEl) stressValEl.innerText = `${hrStress}% STRESS INDEX`;
        if (stressEl) stressEl.style.width = `${hrStress}%`;
      }
    }

    // Pulmonary stress coupled to SpO2
    if (this.hotspotData.lungs) {
      const lungStress = Math.min(100, Math.max(10, Math.round((100 - telemetry.spo2) * 8.5)));
      this.hotspotData.lungs.stressPct = lungStress;
      if (this.selectedHotspot === 'lungs') {
        const stressValEl = document.getElementById('twin-stress-val');
        const stressEl = document.getElementById('twin-stress-bar');
        if (stressValEl) stressValEl.innerText = `${lungStress}% STRESS INDEX`;
        if (stressEl) stressEl.style.width = `${lungStress}%`;
      }
    }

    // Brain & SANS coupled to cephalic fluid shift & stress score
    if (this.hotspotData.brain && digitalTwin) {
      const brainStress = Math.min(95, Math.max(20, Math.round((digitalTwin.cephalicFluidShiftMl / 25) + (telemetry.stressScore * 0.3))));
      this.hotspotData.brain.stressPct = brainStress;
      if (this.selectedHotspot === 'brain') {
        const stressValEl = document.getElementById('twin-stress-val');
        const stressEl = document.getElementById('twin-stress-bar');
        if (stressValEl) stressValEl.innerText = `${brainStress}% STRESS INDEX`;
        if (stressEl) stressEl.style.width = `${brainStress}%`;
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.mannequinGroup) {
      this.mannequinGroup.rotation.y += 0.003;
    }

    const time = Date.now() * 0.003;
    this.hotspots.forEach(h => {
      if (h.userData.ring) {
        const scale = 1 + Math.sin(time * 2) * 0.18;
        h.userData.ring.scale.set(scale, scale, scale);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}

window.DigitalTwinVisualizer = DigitalTwinVisualizer;
