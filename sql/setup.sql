-- ============================================================
-- WORKOUT TRACKER — Supabase SQL Setup
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. EXERCISES
CREATE TABLE exercises (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  category     text NOT NULL,
  muscle_group text NOT NULL,
  is_preset    boolean DEFAULT true,
  equipment    text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (name, user_id)
);

-- 2. WORKOUT SESSIONS
CREATE TABLE workout_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date  date NOT NULL,
  exercise_id   uuid REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name text NOT NULL,
  set_number    integer NOT NULL CHECK (set_number > 0),
  reps          integer NOT NULL CHECK (reps > 0),
  weight_kg     numeric(6,2) NOT NULL CHECK (weight_kg >= 0),
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- 3. BODY WEIGHT LOGS
CREATE TABLE body_weight_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date  date NOT NULL,
  weight_kg    numeric(5,2) NOT NULL CHECK (weight_kg > 0),
  notes        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, logged_date)
);

-- 4. INDEXES
CREATE INDEX idx_sessions_user_date    ON workout_sessions(user_id, session_date DESC);
CREATE INDEX idx_sessions_exercise     ON workout_sessions(exercise_id);
CREATE INDEX idx_body_user_date        ON body_weight_logs(user_id, logged_date DESC);
CREATE INDEX idx_exercises_user        ON exercises(user_id);

-- 5. ROW LEVEL SECURITY
ALTER TABLE exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_logs   ENABLE ROW LEVEL SECURITY;

-- Exercises: preset bisa dibaca semua user, custom hanya owner
CREATE POLICY "read_exercises" ON exercises
  FOR SELECT USING (is_preset = true OR auth.uid() = user_id);

CREATE POLICY "insert_custom_exercise" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_preset = false);

CREATE POLICY "update_custom_exercise" ON exercises
  FOR UPDATE USING (auth.uid() = user_id AND is_preset = false);

CREATE POLICY "delete_custom_exercise" ON exercises
  FOR DELETE USING (auth.uid() = user_id AND is_preset = false);

-- Workout sessions: full CRUD hanya owner
CREATE POLICY "workout_owner" ON workout_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Body weight: full CRUD hanya owner
CREATE POLICY "bodyweight_owner" ON body_weight_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. SEED — Preset Exercises
-- ============================================================
INSERT INTO exercises (name, category, muscle_group, is_preset, equipment, user_id) VALUES
  -- Chest
  ('Bench Press',         'Chest',     'Pectorals',       true, 'Barbell',   null),
  ('Incline Bench Press', 'Chest',     'Upper Pectorals', true, 'Barbell',   null),
  ('Dumbbell Fly',        'Chest',     'Pectorals',       true, 'Dumbbell',  null),
  ('Push Up',             'Chest',     'Pectorals',       true, 'Bodyweight',null),
  ('Cable Crossover',     'Chest',     'Pectorals',       true, 'Cable',     null),
  -- Back
  ('Deadlift',            'Back',      'Erectors/Traps',  true, 'Barbell',   null),
  ('Pull Up',             'Back',      'Lats',            true, 'Bodyweight',null),
  ('Barbell Row',         'Back',      'Lats/Rhomboids',  true, 'Barbell',   null),
  ('Lat Pulldown',        'Back',      'Lats',            true, 'Cable',     null),
  ('Seated Cable Row',    'Back',      'Mid Back',        true, 'Cable',     null),
  -- Legs
  ('Squat',               'Legs',      'Quadriceps',      true, 'Barbell',   null),
  ('Leg Press',           'Legs',      'Quadriceps',      true, 'Machine',   null),
  ('Romanian Deadlift',   'Legs',      'Hamstrings',      true, 'Barbell',   null),
  ('Leg Curl',            'Legs',      'Hamstrings',      true, 'Machine',   null),
  ('Leg Extension',       'Legs',      'Quadriceps',      true, 'Machine',   null),
  ('Calf Raise',          'Legs',      'Calves',          true, 'Machine',   null),
  -- Shoulders
  ('Overhead Press',      'Shoulders', 'Deltoids',        true, 'Barbell',   null),
  ('Dumbbell Lateral Raise','Shoulders','Side Deltoids',  true, 'Dumbbell',  null),
  ('Front Raise',         'Shoulders', 'Front Deltoids',  true, 'Dumbbell',  null),
  ('Face Pull',           'Shoulders', 'Rear Deltoids',   true, 'Cable',     null),
  -- Arms
  ('Barbell Curl',        'Arms',      'Biceps',          true, 'Barbell',   null),
  ('Hammer Curl',         'Arms',      'Brachialis',      true, 'Dumbbell',  null),
  ('Tricep Pushdown',     'Arms',      'Triceps',         true, 'Cable',     null),
  ('Skull Crusher',       'Arms',      'Triceps',         true, 'Barbell',   null),
  ('Dips',                'Arms',      'Triceps',         true, 'Bodyweight',null),
  -- Core
  ('Plank',               'Core',      'Abs/Core',        true, 'Bodyweight',null),
  ('Crunch',              'Core',      'Abs',             true, 'Bodyweight',null),
  ('Russian Twist',       'Core',      'Obliques',        true, 'Bodyweight',null),
  ('Hanging Leg Raise',   'Core',      'Lower Abs',       true, 'Bodyweight',null),
  -- Cardio
  ('Running',             'Cardio',    'Full Body',       true, 'Bodyweight',null),
  ('Rowing',              'Cardio',    'Full Body',       true, 'Machine',   null),
  ('Jump Rope',           'Cardio',    'Full Body',       true, 'Bodyweight',null),
  ('Box Jump',            'Cardio',    'Legs',            true, 'Bodyweight',null);
