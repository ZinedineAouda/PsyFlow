CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    rfid_uid VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(32),
    diagnosis TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_rfid ON patients(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);
