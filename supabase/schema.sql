-- ==============================================================================
-- AstraVital AI - Supabase Database Schema
-- NASA Space Apps Challenge 2026
-- Intelligent Astronaut Health Monitoring & Decision Support Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('astronaut', 'flight_surgeon', 'mission_control', 'admin')),
    callsign TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MISSIONS
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_code TEXT UNIQUE NOT NULL,
    mission_name TEXT NOT NULL,
    destination TEXT NOT NULL CHECK (destination IN ('LEO_ISS', 'Lunar_Gateway', 'Moon_Surface', 'Mars_Transit', 'Mars_Base')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PLANNING', 'ACTIVE', 'COMPLETED', 'EMERGENCY')),
    launch_date TIMESTAMP WITH TIME ZONE,
    target_arrival_date TIMESTAMP WITH TIME ZONE,
    duration_days INT NOT NULL DEFAULT 180,
    trajectory_vector JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ASTRONAUT PROFILES
CREATE TABLE IF NOT EXISTS astronaut_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crew_role TEXT NOT NULL,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    blood_type TEXT NOT NULL,
    age INT NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    baseline_vo2_max NUMERIC(4,1),
    baseline_bone_density NUMERIC(4,2), -- T-Score
    radiation_career_cumulative_msv NUMERIC(8,2) DEFAULT 0.0,
    emergency_contact JSONB,
    medical_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HEALTH METRICS (Aggregated telemetry time-series)
CREATE TABLE IF NOT EXISTS health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    heart_rate NUMERIC(5,1) NOT NULL, -- bpm
    oxygen_saturation NUMERIC(4,1) NOT NULL, -- % SpO2
    blood_pressure_systolic INT NOT NULL, -- mmHg
    blood_pressure_diastolic INT NOT NULL, -- mmHg
    body_temperature NUMERIC(4,2) NOT NULL, -- Celsius
    respiration_rate NUMERIC(4,1) NOT NULL, -- breaths/min
    stress_score INT NOT NULL CHECK (stress_score BETWEEN 0 AND 100),
    sleep_quality_score INT NOT NULL CHECK (sleep_quality_score BETWEEN 0 AND 100),
    hydration_level_pct NUMERIC(4,1) NOT NULL, -- %
    bone_density_index NUMERIC(4,2), -- current estimated T-score
    muscle_loss_risk_pct NUMERIC(4,1), -- % risk
    overall_health_score INT NOT NULL CHECK (overall_health_score BETWEEN 0 AND 100),
    health_status TEXT NOT NULL CHECK (health_status IN ('EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL'))
);

-- 5. SENSOR DATA (High frequency raw sensor streams)
CREATE TABLE IF NOT EXISTS sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    sensor_type TEXT NOT NULL CHECK (sensor_type IN ('ECG', 'PULSE_OX', 'RAD_BADGE', 'CORE_TEMP', 'ACCELEROMETER', 'EEG')),
    sampling_rate_hz INT NOT NULL DEFAULT 50,
    device_id TEXT NOT NULL,
    battery_level INT CHECK (battery_level BETWEEN 0 AND 100),
    signal_quality_pct INT CHECK (signal_quality_pct BETWEEN 0 AND 100),
    raw_payload JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MENTAL HEALTH LOGS
CREATE TABLE IF NOT EXISTS mental_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
    isolation_feeling_score INT NOT NULL CHECK (isolation_feeling_score BETWEEN 1 AND 10),
    cognitive_reaction_speed_ms INT NOT NULL,
    journal_entry TEXT,
    voice_sentiment_analysis JSONB,
    sleep_duration_hours NUMERIC(3,1) NOT NULL,
    ai_wellness_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SPACE ENVIRONMENT DATA (NASA DONKI / Solar Radiation telemetry)
CREATE TABLE IF NOT EXISTS space_environment_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    solar_flare_class TEXT, -- e.g., 'C2.4', 'M5.1', 'X1.2'
    geomagnetic_k_index NUMERIC(3,1), -- Kp index 0-9
    proton_flux_pfu NUMERIC(10,2),
    cosmic_ray_dose_rate_usv_h NUMERIC(8,2) NOT NULL, -- microSieverts/hour
    cabin_radiation_shielding_status TEXT NOT NULL DEFAULT 'NOMINAL',
    eva_status TEXT NOT NULL DEFAULT 'STANDBY' CHECK (eva_status IN ('STANDBY', 'ACTIVE_EVA', 'RESTRICTED_SOLAR_STORM'))
);

-- 8. ALERTS
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    category TEXT NOT NULL CHECK (category IN ('CARDIAC', 'RESPIRATORY', 'RADIATION', 'MENTAL', 'ENVIRONMENTAL', 'DEHYDRATION')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    anomaly_probability NUMERIC(4,3),
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. RISK PREDICTIONS (AI Predictive Model Outputs)
CREATE TABLE IF NOT EXISTS risk_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    prediction_horizon_days INT NOT NULL, -- 7, 30, 90, 180
    cardiovascular_deconditioning_risk NUMERIC(4,3), -- 0.000 to 1.000
    osteopenia_bone_loss_risk NUMERIC(4,3),
    sans_ocular_syndrome_risk NUMERIC(4,3),
    radiation_carcinogenesis_risk NUMERIC(4,3),
    psychological_burnout_risk NUMERIC(4,3),
    recommended_exercise_countermeasure TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. DIGITAL TWINS
CREATE TABLE IF NOT EXISTS digital_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE CASCADE UNIQUE,
    twin_model_version TEXT DEFAULT 'v3.2-AstraSim',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    biomechanical_state JSONB NOT NULL,
    metabolic_rate_cal_day INT NOT NULL,
    cumulative_microgravity_hours INT NOT NULL,
    organ_stress_map JSONB NOT NULL, -- { heart: 0.22, lungs: 0.15, bones: 0.48, brain: 0.31 }
    mars_simulation_scenarios JSONB
);

-- 11. EMERGENCY EVENTS
CREATE TABLE IF NOT EXISTS emergency_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    trigger_source TEXT NOT NULL,
    telemetry_snapshot JSONB NOT NULL,
    protocol_code TEXT NOT NULL, -- e.g. 'NASA-MED-RED-04'
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'STABILIZED', 'RESOLVED')),
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 12. AI RECOMMENDATIONS (Astra AI clinical & countermeasures guidance)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    clinical_finding TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    confidence_score NUMERIC(4,3) NOT NULL,
    space_medicine_citation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. MISSION REPORTS
CREATE TABLE IF NOT EXISTS mission_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    report_title TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('DAILY_TELEMETRY', 'MEDICAL_EVALUATION', 'RADIATION_DOSIMETRY', 'POST_MISSION_READINESS')),
    summary TEXT NOT NULL,
    data_metrics JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for Ultra-Fast Telemetry Queries
CREATE INDEX IF NOT EXISTS idx_health_metrics_astronaut_ts ON health_metrics(astronaut_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_astronaut_ts ON sensor_data(astronaut_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity_created ON alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_env_mission_ts ON space_environment_data(mission_id, recorded_at DESC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE astronaut_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_reports ENABLE ROW LEVEL SECURITY;

-- Basic Permissive Policy for demo & authenticated clients
CREATE POLICY "Public Read for Missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read health metrics" ON health_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public insert health metrics" ON health_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read digital twins" ON digital_twins FOR SELECT USING (true);


-- -----------------------------------------------------------------------------
-- 14. NASA OSDR & GENELAB RESEARCH REPOSITORY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nasa_osdr_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id TEXT UNIQUE NOT NULL, -- e.g. 'OSD-379'
    legacy_id TEXT, -- e.g. 'GLDS-379'
    title TEXT NOT NULL,
    organism TEXT NOT NULL,
    mission_context TEXT NOT NULL,
    spacecraft TEXT,
    assay_type TEXT NOT NULL,
    physiological_system TEXT NOT NULL,
    description TEXT NOT NULL,
    key_findings TEXT NOT NULL,
    linked_indicators JSONB,
    doi TEXT,
    official_url TEXT NOT NULL,
    data_classification TEXT NOT NULL DEFAULT 'REAL RESEARCH DATA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 15. NASA TECHNICAL REPORTS SERVER (NTRS) PUBLICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nasa_ntrs_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id TEXT UNIQUE NOT NULL, -- e.g. 'NASA/SP-20205009772'
    document_id TEXT NOT NULL,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    publication_date DATE NOT NULL,
    category TEXT NOT NULL,
    organization TEXT NOT NULL,
    abstract TEXT NOT NULL,
    key_points JSONB,
    linked_indicators JSONB,
    official_url TEXT NOT NULL,
    data_classification TEXT NOT NULL DEFAULT 'REAL RESEARCH DATA',
    citation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 16. DATA PROVENANCE REGISTRY & AUDIT
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_provenance_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parameter_key TEXT UNIQUE NOT NULL,
    parameter_name TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('REAL_RESEARCH_DATA', 'SIMULATED_TELEMETRY', 'DERIVED_ANALYTICAL_DATA')),
    unit TEXT,
    nominal_baseline TEXT NOT NULL,
    source_mechanism TEXT NOT NULL,
    linked_research_ids JSONB,
    scientific_limitations TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS & Policies for new tables
ALTER TABLE nasa_osdr_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE nasa_ntrs_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_provenance_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read osdr studies" ON nasa_osdr_studies FOR SELECT USING (true);
CREATE POLICY "Allow public read ntrs publications" ON nasa_ntrs_publications FOR SELECT USING (true);
CREATE POLICY "Allow public read provenance registry" ON data_provenance_registry FOR SELECT USING (true);
