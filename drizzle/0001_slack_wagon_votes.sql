CREATE TABLE IF NOT EXISTS slack_wagon_votes (
  user_id TEXT NOT NULL,
  wagon TEXT NOT NULL,
  PRIMARY KEY (user_id, wagon)
);
