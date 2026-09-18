ALTER TABLE profiles
ADD COLUMN daily_goal INT NOT NULL DEFAULT 5,
ADD CONSTRAINT daily_goal_check CHECK (daily_goal > 0);
