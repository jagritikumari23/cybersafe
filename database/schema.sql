-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    incident_date TIMESTAMPTZ NOT NULL,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_contact VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Filed',
    submission_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ai_triage_category VARCHAR(100),
    ai_triage_urgency VARCHAR(50),
    ai_triage_summary TEXT,
    ai_escalation_target VARCHAR(100),
    ai_escalation_reasoning TEXT,
    suspect_details JSONB,
    incident_location JSONB,
    additional_evidence_text TEXT,
    evidence_files_metadata JSONB,
    timeline_notes TEXT,
    assigned_officer_name VARCHAR(255),
    chat_id VARCHAR(255)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id SERIAL PRIMARY KEY,
    report_id VARCHAR(255) REFERENCES reports(id),
    sender VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ
);

-- Create evidence_files table
CREATE TABLE IF NOT EXISTS evidence_files (
    id VARCHAR(255) PRIMARY KEY,
    report_id VARCHAR(255) REFERENCES reports(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
); 