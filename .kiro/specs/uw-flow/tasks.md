# Implementation Plan: UW Flow

## Overview

Implement UW Flow as a React Native mobile app backed by five TypeScript microservices (DryRoute_Engine, Wait_Time_Service, Route_Planner, Heatmap_Service, Alert_Service) behind an API Gateway, with PostgreSQL+PostGIS for geospatial data, Redis for caching, and WebSocket support for real-time updates.

## Tasks

- [x] 1. Project scaffolding and shared types
  - Initialize monorepo structure with packages for each service and the mobile client
  - Define all shared TypeScript interfaces from the design: `RouteSegment`, `RouteOption`, `SmartRoute`, `IndoorShortcut`, `Venue`, `WaitPrediction`, `CheckIn`, `HeatmapCell`, `HeatmapSnapshot`, `UserAlertPreferences`, `RainForecast`, `RainCell`, `GeoPoint`, `GeoPolygon`
  - Set up Jest + fast-check as the test framework across all service packages
  - Set up PostgreSQL+PostGIS schema migrations and Redis connection utilities
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 2. DryRoute_Engine
  - [x] 2.1 Implement campus path graph with covered-path edge weights
    - Model campus walkways as a weighted graph in PostGIS; assign edge weights based on `coverage_type` and rain probability
    - Implement modified Dijkstra's algorithm that maximizes `coverage_score`
    - Implement `coverage_score` calculation (% of route distance that is covered)
    - Expose `GET /routes/dry` and `GET /routes/dry/coverage-score` endpoints
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]* 2.2 Write property test for dry route coverage maximization
    - **Property 1: Dry route maximizes coverage score**
    - **Validates: Requirements 1.1, 1.4**

  - [ ]* 2.3 Write property test for coverage score range
    - **Property 2: Coverage score is always a valid percentage**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write property test for covered segment type mapping
    - **Property 4: Covered segment types map to is_covered = true**
    - **Validates: Requirements 1.5**

  - [x] 2.5 Implement Rain_API integration with Redis caching and staleness fallback
    - Fetch rain forecast from Rain_API on a ≤5-minute refresh interval
    - Cache the most recent valid `RainForecast` in Redis (TTL: 10 minutes)
    - On Rain_API error or timeout, fall back to cached forecast and set `staleness_warning: true`
    - On cold start (no cache), compute routes from static covered-path data only with `staleness_warning: true`
    - Display `fetched_at` timestamp on forecast responses
    - _Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 2.6 Write property test for stale Rain_API staleness warning
    - **Property 5: Stale Rain_API produces staleness warning**
    - **Validates: Requirements 1.6, 7.5**

  - [ ]* 2.7 Write unit tests for Rain_API fallback and cold-start behavior
    - Test fallback to cached forecast on HTTP error
    - Test cold-start behavior when no cached forecast exists
    - _Requirements: 1.6, 7.5_

- [x] 3. Checkpoint — Ensure all DryRoute_Engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Wait_Time_Service
  - [x] 4.1 Implement venue registry and wait time data model
    - Seed the 11 supported venues: HUB food court, Starbucks, Local Point, District Market, UW gym equipment areas, IMA, UW Libraries, advising offices, Hall Health, UW Bookstore, Link Light Rail station
    - Implement `GET /venues` and `GET /venues/:id/wait-time` endpoints
    - Track `last_checkin_at` per venue; set `unverified: true` when gap exceeds 30 minutes
    - _Requirements: 2.1, 2.4, 2.7_

  - [ ]* 4.2 Write unit tests for all 11 supported venues
    - Verify each venue returns a valid wait time response
    - _Requirements: 2.4_

  - [~] 4.3 Implement check-in ingestion and rolling aggregator
    - Implement `POST /venues/:id/checkins` endpoint
    - Ingest check-ins into a rolling time-window aggregator; update current wait time estimate within 60 seconds
    - Track `checkin_count` for the active aggregation window
    - _Requirements: 2.3, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 4.4 Write property test for check-in data persistence
    - **Property 19: Check-in data is persisted completely**
    - **Validates: Requirements 6.1**

  - [ ]* 4.5 Write property test for check-in count accuracy
    - **Property 20: Check-in count reflects recent submissions**
    - **Validates: Requirements 6.4**

  - [ ]* 4.6 Write unit test for check-in latency (≤60 seconds)
    - Submit a check-in and verify it appears in the wait time estimate within 60 seconds
    - _Requirements: 2.3, 6.3_

  - [~] 4.7 Implement wait time prediction model (+10/+20/+30 minutes)
    - Implement lightweight time-series prediction seeded with historical data per venue, day-of-week, and time-of-day
    - Ensure predictions array always contains exactly three entries with `minutes_from_now` of 10, 20, and 30
    - Derive `"Go Now"` / `"Go Later"` recommendations and `optimal_arrival_time` from prediction direction
    - _Requirements: 2.2, 2.5, 2.6_

  - [ ]* 4.8 Write property test for prediction horizons completeness
    - **Property 6: Wait time predictions always include all three horizons**
    - **Validates: Requirements 2.2**

  - [ ]* 4.9 Write property test for recommendation consistency
    - **Property 7: Recommendation logic is consistent with prediction direction**
    - **Validates: Requirements 2.5, 2.6**

  - [ ]* 4.10 Write property test for unverified flag after 30-minute gap
    - **Property 8: Unverified flag set after 30-minute check-in gap**
    - **Validates: Requirements 2.7**

  - [~] 4.11 Implement location verification for check-ins
    - Track `last_verified_location_at` per user per venue
    - If elapsed time > 45 minutes, hold check-in in pending state and return `location_confirmation_required: true`
    - Commit check-in only after client confirms location
    - _Requirements: 6.5_

  - [ ]* 4.12 Write property test for stale location confirmation prompt
    - **Property 21: Stale location triggers confirmation prompt**
    - **Validates: Requirements 6.5**

- [x] 5. Checkpoint — Ensure all Wait_Time_Service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Heatmap_Service
  - [x] 6.1 Implement heatmap grid and density computation
    - Define PostGIS heatmap grid cells aligned to campus geography
    - Compute `density_score` (0–100) and `label` ("Quiet" / "Moderate" / "Busy") per cell from check-in data, anonymized location signals, and historical patterns
    - Implement `GET /heatmap` and `GET /heatmap/area/:cell_id` endpoints
    - _Requirements: 4.1, 4.4_

  - [ ]* 6.2 Write property test for heatmap cell validity
    - **Property 12: Heatmap cells always have valid density labels**
    - **Validates: Requirements 4.1, 4.4**

  - [x] 6.3 Implement quiet spots endpoint and refresh cycle
    - Implement `GET /heatmap/quiet-spots` returning the top 3 least-crowded study-eligible locations
    - Schedule heatmap refresh at ≤2-minute intervals
    - _Requirements: 4.2, 4.3, 4.5, 4.6_

  - [ ]* 6.4 Write property test for quiet spots selection
    - **Property 13: Quiet spots are the three least-crowded study locations**
    - **Validates: Requirements 4.5, 4.6**

  - [x] 6.5 Implement WebSocket push for real-time heatmap updates
    - Implement `WebSocket /ws/heatmap` that pushes `HeatmapSnapshot` updates every ≤2 minutes
    - On client reconnect, send a full snapshot immediately
    - _Requirements: 4.2, 4.3_

  - [ ]* 6.6 Write unit test for WebSocket reconnect full-snapshot delivery
    - Disconnect a client, reconnect, and verify a full snapshot is sent
    - _Requirements: 4.2_

- [ ] 7. Route_Planner
  - [x] 7.1 Implement multi-factor route scoring and ranking
    - Compose inputs from DryRoute_Engine (coverage), Heatmap_Service (crowd density), static elevation dataset, and construction zone registry
    - Score and rank candidate routes; expose `GET /routes/smart` endpoint
    - Exclude any `RouteSegment` with `has_construction: true` from returned routes
    - _Requirements: 3.1, 3.4, 3.5_

  - [ ]* 7.2 Write property test for no construction segments in routes
    - **Property 9: No construction segments appear in planned routes**
    - **Validates: Requirements 3.5**

  - [x] 7.3 Implement late-warning logic and indoor shortcut display
    - Compare `estimated_time_minutes` against `time_to_class_minutes`; set `late_warning: true` and promote fastest route when travel time exceeds time-to-class
    - Populate `indoor_shortcuts` with `building_name` and `time_saved_minutes > 0` for each indoor shortcut used
    - Include `estimated_travel_time` on all returned routes
    - _Requirements: 3.2, 3.3, 3.6_

  - [ ]* 7.4 Write property test for late warning correctness
    - **Property 10: Late warning set when travel time exceeds time-to-class**
    - **Validates: Requirements 3.3**

  - [ ]* 7.5 Write property test for indoor shortcut validity
    - **Property 11: Indoor shortcuts always include building name and positive time saved**
    - **Validates: Requirements 3.2**

  - [x] 7.6 Implement live route WebSocket and real-time condition updates
    - Implement `WebSocket /ws/routes/live` that re-scores and pushes updated routes as rain, crowd, and construction conditions change
    - _Requirements: 3.4_

- [x] 8. Checkpoint — Ensure all Route_Planner and Heatmap_Service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Alert_Service
  - [x] 9.1 Implement alert preferences storage and retrieval
    - Implement `POST /alerts/preferences` and `GET /alerts/preferences` endpoints
    - Persist `UserAlertPreferences` to the database
    - _Requirements: 5.4_

  - [ ]* 9.2 Write property test for alert preferences round-trip
    - **Property 16: Alert preferences round-trip**
    - **Validates: Requirements 5.4**

  - [x] 9.3 Implement background alert evaluation loop
    - Run per-user evaluation loop checking: wait time thresholds vs. current venue data, rain proximity from DryRoute_Engine, and favorite study spot crowd changes from Heatmap_Service
    - Respect per-type opt-out flags before generating any alert
    - Enforce hard cap of 10 notifications per hour per user (sliding window, enforced before dispatch)
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [ ]* 9.4 Write property test for rain proximity alert generation
    - **Property 3: Rain proximity triggers alert generation**
    - **Validates: Requirements 1.3, 5.2**

  - [ ]* 9.5 Write property test for wait time threshold alert
    - **Property 14: Wait time threshold crossing triggers alert**
    - **Validates: Requirements 5.1**

  - [ ]* 9.6 Write property test for favorite spot crowd drop alert
    - **Property 15: Favorite spot crowd drop triggers alert**
    - **Validates: Requirements 5.3**

  - [ ]* 9.7 Write property test for disabled alert type suppression
    - **Property 17: Disabled alert types are suppressed**
    - **Validates: Requirements 5.5**

  - [ ]* 9.8 Write property test for notification rate cap
    - **Property 18: Notification rate cap enforced**
    - **Validates: Requirements 5.6**

  - [x] 9.9 Implement push notification dispatch with retry logic
    - Integrate with push notification provider
    - Use idempotency keys to prevent duplicate notifications
    - Retry failed deliveries up to 3 times with exponential backoff
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 9.10 Write unit tests for end-to-end alert dispatch and retry logic
    - Test each alert type dispatches correctly end-to-end
    - Test retry behavior on push delivery failure
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Rain forecast model property test
  - [ ]* 10.1 Write property test for rain forecast spatial resolution
    - **Property 22: Rain forecast cells respect spatial resolution**
    - **Validates: Requirements 7.1**

- [x] 11. API Gateway and authentication
  - Implement API Gateway with UW NetID OAuth authentication
  - Add rate limiting and route all requests to the appropriate service
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 12. React Native mobile client — core navigation and routing screens
  - Implement dry route request screen: origin/destination input, route list with `coverage_score` display, staleness indicator
  - Implement smart route screen: multi-factor route display with indoor shortcut names, time saved, estimated travel time, and late warning banner
  - Wire client to `GET /routes/dry`, `GET /routes/smart`, and `WebSocket /ws/routes/live`
  - _Requirements: 1.1, 1.2, 1.6, 3.1, 3.2, 3.3, 3.6_

- [x] 13. React Native mobile client — wait times and check-in screens
  - Implement venue list screen showing current wait times, predictions, "Go Now"/"Go Later" badges, staleness warnings, and check-in counts
  - Implement check-in submission flow completable in 3 taps or fewer, including location confirmation prompt when required
  - Wire client to `GET /venues`, `GET /venues/:id/wait-time`, and `POST /venues/:id/checkins`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 6.4, 6.5_

- [x] 14. React Native mobile client — heatmap and alerts screens
  - Implement live heatmap overlay on campus map; support tap-to-view crowd label per area; highlight top 3 quiet study spots
  - Implement alert preferences screen: toggle per alert type, set wait time threshold, manage favorite study spots
  - Wire client to `GET /heatmap`, `GET /heatmap/area/:cell_id`, `GET /heatmap/quiet-spots`, `WebSocket /ws/heatmap`, and alert preferences endpoints
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 5.4_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- Each property test must include the comment tag: `// Feature: uw-flow, Property N: <property_text>`
- Checkpoints ensure incremental validation before moving to the next subsystem
