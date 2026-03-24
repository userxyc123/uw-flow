# Requirements Document

## Introduction

UW Flow is a real-time campus movement and comfort assistant for University of Washington students. The app helps students navigate campus smarter by combining dry-route navigation, live wait times, crowd-aware routing, and personalized alerts into a single mobile experience. The goal is to reduce time spent waiting in lines, getting caught in rain, and navigating congested paths between classes.

## Glossary

- **App**: The UW Flow mobile application
- **User**: A UW student using the App
- **DryRoute_Engine**: The subsystem responsible for computing rain-aware navigation paths
- **Wait_Time_Service**: The subsystem that aggregates and predicts wait times for campus venues
- **Route_Planner**: The subsystem that computes optimal routes considering multiple factors (rain, crowds, hills, construction, time constraints)
- **Heatmap_Service**: The subsystem that tracks and visualizes real-time crowd density across campus
- **Alert_Service**: The subsystem that generates and delivers personalized push notifications to Users
- **Venue**: Any campus location with trackable wait times (dining halls, libraries, gym, advising offices, etc.)
- **Covered_Path**: Any walkway segment that provides overhead protection from rain (covered walkways, building interiors, tunnels, overhangs)
- **Check_In**: A crowd-sourced data point submitted by a User reporting current conditions at a location
- **Rain_API**: The external weather data provider supplying micro-forecast data for the UW campus area
- **Coverage_Score**: A percentage (0–100%) representing the proportion of a route that is covered from rain

---

## Requirements

### Requirement 1: Dry Route Navigation

**User Story:** As a UW student, I want to find the driest path between two campus locations, so that I can avoid getting wet when it rains.

#### Acceptance Criteria

1. WHEN a User requests navigation between two campus points, THE DryRoute_Engine SHALL compute a route that maximizes use of Covered_Paths.
2. WHEN a route is displayed, THE App SHALL show the Coverage_Score for that route.
3. WHEN the Rain_API predicts rain within 10 minutes at the User's current location, THE Alert_Service SHALL notify the User with the estimated minutes until rain begins.
4. WHEN multiple routes exist between two points, THE DryRoute_Engine SHALL present the route with the highest Coverage_Score as the default recommendation.
5. THE DryRoute_Engine SHALL include covered walkways, building interiors, tunnels, and overhangs as valid Covered_Path segments.
6. IF the Rain_API is unavailable, THEN THE DryRoute_Engine SHALL compute routes using cached weather data and display a staleness indicator to the User.

---

### Requirement 2: Live Wait Times

**User Story:** As a UW student, I want to see current wait times at campus venues, so that I can decide when and where to go to avoid long lines.

#### Acceptance Criteria

1. THE Wait_Time_Service SHALL display current estimated wait times for each supported Venue.
2. WHEN a User views a Venue, THE Wait_Time_Service SHALL show predicted wait times at 10, 20, and 30 minutes into the future.
3. WHEN a User submits a Check_In at a Venue, THE Wait_Time_Service SHALL incorporate the Check_In into the current wait time estimate within 60 seconds.
4. THE Wait_Time_Service SHALL support the following Venues: HUB food court, Starbucks, Local Point, District Market, UW gym equipment areas, IMA, UW Libraries, advising offices, Hall Health, UW Bookstore, and Link Light Rail station.
5. WHEN the predicted future wait time at a Venue is lower than the current wait time, THE App SHALL display a "Go Later" recommendation with the optimal time to arrive.
6. WHEN the predicted future wait time at a Venue is higher than the current wait time, THE App SHALL display a "Go Now" recommendation.
7. IF no Check_In data has been received for a Venue within 30 minutes, THEN THE Wait_Time_Service SHALL mark that Venue's wait time as unverified and display a staleness warning.

---

### Requirement 3: Smart Movement Planner

**User Story:** As a UW student, I want a route planner that accounts for rain, crowds, hills, construction, and my class schedule, so that I can arrive on time without unnecessary stress.

#### Acceptance Criteria

1. WHEN a User requests a route, THE Route_Planner SHALL compute a path that considers rain coverage, crowd density, elevation change, active construction zones, and the User's time until next class.
2. WHEN a route uses an indoor shortcut, THE Route_Planner SHALL display the name of the building and the estimated time saved.
3. WHEN the estimated travel time exceeds the User's time until next class, THE Route_Planner SHALL alert the User and suggest the fastest available route.
4. THE Route_Planner SHALL update route recommendations in real time as rain, crowd, and construction conditions change.
5. WHEN construction is detected on a route segment, THE Route_Planner SHALL exclude that segment and reroute around it.
6. THE Route_Planner SHALL display the estimated travel time for each suggested route.

---

### Requirement 4: Campus Flow Heatmap

**User Story:** As a UW student, I want to see a live map of crowd density across campus, so that I can avoid congested areas and find quiet spaces.

#### Acceptance Criteria

1. THE Heatmap_Service SHALL display a real-time overlay on the campus map showing crowd density levels for walkways and buildings.
2. THE Heatmap_Service SHALL refresh crowd density data at intervals no greater than 2 minutes.
3. WHEN a campus area transitions from low to high crowd density, THE Heatmap_Service SHALL update the map overlay within one refresh cycle.
4. THE App SHALL allow a User to tap any area on the heatmap to view the current crowd level label (e.g., "Quiet", "Moderate", "Busy").
5. THE Heatmap_Service SHALL identify and surface currently quiet study spots to the User on demand.
6. WHEN a User views the heatmap, THE App SHALL highlight the top 3 least-crowded study locations currently available.

---

### Requirement 5: Personalized Alerts

**User Story:** As a UW student, I want to receive timely, relevant push notifications about wait times, rain, and quiet spots, so that I can make better decisions without actively checking the app.

#### Acceptance Criteria

1. WHEN a Venue's wait time drops below a User-configured threshold, THE Alert_Service SHALL send the User a push notification within 60 seconds of the threshold being crossed.
2. WHEN rain is predicted to begin within 10 minutes near the User's current location, THE Alert_Service SHALL send a push notification recommending the covered route to the User's next class.
3. WHEN a study location the User has favorited becomes significantly less crowded than its historical average, THE Alert_Service SHALL notify the User.
4. THE App SHALL allow a User to configure which alert types to receive and set personal thresholds for wait time notifications.
5. IF a User has disabled notifications for a specific alert type, THEN THE Alert_Service SHALL suppress that alert type for that User.
6. THE Alert_Service SHALL send no more than 10 push notifications per hour per User to prevent notification fatigue.

---

### Requirement 6: Crowd-Sourced Check-Ins

**User Story:** As a UW student, I want to submit real-time check-ins about conditions at campus locations, so that other students benefit from up-to-date information.

#### Acceptance Criteria

1. WHEN a User submits a Check_In, THE App SHALL record the Venue, reported wait time or crowd level, and timestamp.
2. THE App SHALL allow a User to submit a Check_In in 3 taps or fewer.
3. WHEN a User submits a Check_In, THE Wait_Time_Service SHALL incorporate the data into the Venue's current estimate within 60 seconds.
4. THE App SHALL display the number of recent Check_Ins contributing to a Venue's current wait time estimate.
5. IF a Check_In is submitted more than 45 minutes after the User's last verified location at that Venue, THEN THE App SHALL prompt the User to confirm their current location before accepting the Check_In.

---

### Requirement 7: Rain Data Integration

**User Story:** As a UW student, I want the app to use accurate, campus-specific rain forecasts, so that rain alerts and dry routes reflect actual conditions at UW.

#### Acceptance Criteria

1. THE App SHALL integrate with a Rain_API that provides precipitation forecasts at a spatial resolution of 500 meters or finer for the UW Seattle campus area.
2. THE App SHALL refresh rain forecast data at intervals no greater than 5 minutes.
3. WHEN the Rain_API returns a forecast update, THE DryRoute_Engine SHALL recompute affected route recommendations within 30 seconds.
4. THE App SHALL display the timestamp of the most recent rain forecast data to the User.
5. IF the Rain_API returns an error response, THEN THE App SHALL fall back to the most recent valid forecast and display a warning that data may be outdated.
