CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  best_combo INTEGER NOT NULL DEFAULT 0,
  games INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS game_runs (
  run_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  combo INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  missed INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_runs_player ON game_runs(player_id, created_at DESC);
