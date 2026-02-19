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

CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_number INTEGER NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'visit_date'
  ) THEN
    ALTER TABLE visits ADD COLUMN visit_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;
