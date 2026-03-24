import { Pool } from "pg";

/**
 * Runs all pending migrations in order.
 * Migrations are idempotent — safe to run multiple times.
 */
export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS postgis;

    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const migrations: Array<{ name: string; sql: string }> = [
    {
      name: "001_route_segments",
      sql: `
        CREATE TABLE IF NOT EXISTS route_segments (
          segment_id       TEXT PRIMARY KEY,
          start_point      GEOGRAPHY(POINT, 4326) NOT NULL,
          end_point        GEOGRAPHY(POINT, 4326) NOT NULL,
          distance_meters  DOUBLE PRECISION NOT NULL,
          is_covered       BOOLEAN NOT NULL DEFAULT FALSE,
          coverage_type    TEXT NOT NULL CHECK (coverage_type IN ('walkway','building_interior','tunnel','overhang','open')),
          elevation_change_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
          has_construction BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE INDEX IF NOT EXISTS idx_route_segments_start ON route_segments USING GIST (start_point);
        CREATE INDEX IF NOT EXISTS idx_route_segments_end   ON route_segments USING GIST (end_point);
      `,
    },
    {
      name: "002_venues",
      sql: `
        CREATE TABLE IF NOT EXISTS venues (
          venue_id  TEXT PRIMARY KEY,
          name      TEXT NOT NULL,
          location  GEOGRAPHY(POINT, 4326) NOT NULL,
          category  TEXT NOT NULL CHECK (category IN ('dining','library','gym','advising','health','retail','transit'))
        );
        CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING GIST (location);
      `,
    },
    {
      name: "003_checkins",
      sql: `
        CREATE TABLE IF NOT EXISTS checkins (
          checkin_id            TEXT PRIMARY KEY,
          venue_id              TEXT NOT NULL REFERENCES venues(venue_id),
          user_id               TEXT NOT NULL,
          reported_wait_minutes INTEGER NOT NULL,
          crowd_level           TEXT NOT NULL CHECK (crowd_level IN ('low','medium','high')),
          submitted_at          TIMESTAMPTZ NOT NULL,
          location_verified     BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE INDEX IF NOT EXISTS idx_checkins_venue_submitted ON checkins (venue_id, submitted_at DESC);
      `,
    },
    {
      name: "004_heatmap_cells",
      sql: `
        CREATE TABLE IF NOT EXISTS heatmap_cells (
          cell_id       TEXT PRIMARY KEY,
          polygon       GEOGRAPHY(POLYGON, 4326) NOT NULL,
          density_score DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (density_score >= 0 AND density_score <= 100),
          label         TEXT NOT NULL CHECK (label IN ('Quiet','Moderate','Busy')),
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_heatmap_cells_polygon ON heatmap_cells USING GIST (polygon);
      `,
    },
    {
      name: "005_alert_preferences",
      sql: `
        CREATE TABLE IF NOT EXISTS alert_preferences (
          user_id                      TEXT PRIMARY KEY,
          wait_time_alerts_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
          wait_time_threshold_minutes  INTEGER NOT NULL DEFAULT 10,
          rain_alerts_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
          quiet_spot_alerts_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
          favorite_study_spots         TEXT[]  NOT NULL DEFAULT '{}'
        );
      `,
    },
    {
      name: "006_construction_zones",
      sql: `
        CREATE TABLE IF NOT EXISTS construction_zones (
          zone_id      TEXT PRIMARY KEY,
          polygon      GEOGRAPHY(POLYGON, 4326) NOT NULL,
          active_from  TIMESTAMPTZ NOT NULL,
          active_until TIMESTAMPTZ NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_construction_zones_polygon ON construction_zones USING GIST (polygon);
        CREATE INDEX IF NOT EXISTS idx_construction_zones_active  ON construction_zones (active_from, active_until);
      `,
    },
  ];

  for (const migration of migrations) {
    const { rows } = await pool.query(
      "SELECT 1 FROM migrations WHERE name = $1",
      [migration.name]
    );
    if (rows.length === 0) {
      await pool.query(migration.sql);
      await pool.query("INSERT INTO migrations (name) VALUES ($1)", [
        migration.name,
      ]);
    }
  }
}
