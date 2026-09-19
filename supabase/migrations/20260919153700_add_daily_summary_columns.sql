ALTER TABLE profiles
ADD COLUMN daily_summary_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN daily_summary_last_sent_date DATE;
