PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id),
  content TEXT,
  excerpt TEXT,
  important_dates TEXT,
  application_fee TEXT,
  age_limit TEXT,
  eligibility TEXT,
  official_link TEXT,
  apply_link TEXT,
  notification_link TEXT,
  last_date DATE,
  correction_last_date DATE,
  exam_date DATE,
  result_date DATE,
  status TEXT DEFAULT 'published',
  is_trending INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Latest Jobs', 'latest-jobs', 1),
  ('Results', 'results', 2),
  ('Admit Card', 'admit-card', 3),
  ('Answer Key', 'answer-key', 4),
  ('Syllabus', 'syllabus', 5);