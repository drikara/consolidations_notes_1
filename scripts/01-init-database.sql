-- Create users table for better-auth
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL CHECK (role IN ('WFM', 'JURY')) DEFAULT 'JURY'
);

-- Create sessions table for better-auth
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts table for better-auth
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create verification tokens table for better-auth
CREATE TABLE IF NOT EXISTS verification_tokens (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date DATE NOT NULL,
  age INTEGER NOT NULL,
  diploma TEXT NOT NULL,
  institution TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  sms_sent_date DATE,
  availability TEXT NOT NULL,
  interview_date DATE,
  metier TEXT NOT NULL CHECK (metier IN (
    'Call Center', 'Agences', 'Bo Réclam', 'Télévente', 
    'Réseaux Sociaux', 'Supervision', 'Bot Cognitive Trainer', 
    'SMC Fixe & Mobile'
  )),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jury_members table
CREATE TABLE IF NOT EXISTS jury_members (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('DRH', 'EPC', 'Représentant du Métier', 'WFM')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create scores table (all technical scores entered by WFM)
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  -- Phase 1 scores
  voice_quality DECIMAL(3,2) CHECK (voice_quality >= 0 AND voice_quality <= 5),
  verbal_communication DECIMAL(3,2) CHECK (verbal_communication >= 0 AND verbal_communication <= 5),
  psychotechnical_test DECIMAL(4,2) CHECK (psychotechnical_test >= 0 AND psychotechnical_test <= 10),
  phase1_decision TEXT CHECK (phase1_decision IN ('ADMIS', 'ÉLIMINÉ')),
  
  -- Phase 2 technical scores (entered by WFM)
  typing_speed INTEGER, -- MPM
  typing_accuracy DECIMAL(5,2), -- Percentage
  excel_test DECIMAL(3,2) CHECK (excel_test >= 0 AND excel_test <= 5),
  dictation DECIMAL(4,2) CHECK (dictation >= 0 AND dictation <= 20),
  sales_simulation DECIMAL(3,2) CHECK (sales_simulation >= 0 AND sales_simulation <= 5),
  analysis_exercise DECIMAL(4,2) CHECK (analysis_exercise >= 0 AND analysis_exercise <= 10),
  
  phase2_date DATE,
  phase2_ff_decision TEXT CHECK (phase2_ff_decision IN ('FAVORABLE', 'DÉFAVORABLE')),
  final_decision TEXT CHECK (final_decision IN ('RECRUTÉ', 'NON RECRUTÉ')),
  comments TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id)
);

-- Create face_to_face_scores table (entered by jury members)
CREATE TABLE IF NOT EXISTS face_to_face_scores (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  jury_member_id INTEGER NOT NULL REFERENCES jury_members(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK (phase IN (1, 2)),
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, jury_member_id, phase)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_metier ON candidates(metier);
CREATE INDEX IF NOT EXISTS idx_scores_candidate ON scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ff_scores_candidate ON face_to_face_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
