-- GJob.in - Performance Indexes
-- Add indexes for faster queries

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_last_date ON posts(last_date);
CREATE INDEX IF NOT EXISTS idx_posts_exam_date ON posts(exam_date);
CREATE INDEX IF NOT EXISTS idx_posts_is_trending ON posts(is_trending);