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
    consultation_type VARCHAR(64),
    source_demande VARCHAR(64),
    suffering_level INTEGER CHECK (suffering_level >= 1 AND suffering_level <= 5),
    hypothese_clinique TEXT,
    plan_evaluation TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at DESC);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128),
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'visit_date'
  ) THEN
    ALTER TABLE visits ADD COLUMN visit_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'consultation_type'
  ) THEN
    ALTER TABLE visits ADD COLUMN consultation_type VARCHAR(64);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'source_demande'
  ) THEN
    ALTER TABLE visits ADD COLUMN source_demande VARCHAR(64);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'suffering_level'
  ) THEN
    ALTER TABLE visits ADD COLUMN suffering_level INTEGER CHECK (suffering_level >= 1 AND suffering_level <= 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'hypothese_clinique'
  ) THEN
    ALTER TABLE visits ADD COLUMN hypothese_clinique TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'plan_evaluation'
  ) THEN
    ALTER TABLE visits ADD COLUMN plan_evaluation TEXT;
  END IF;
END $$;
