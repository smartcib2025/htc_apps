# Hanuman Tennis Academy - Mobile App Design

## Brand Identity

**App Name:** Hanuman Tennis Academy
**Primary Color:** #1B5E20 (Deep Green - Tennis court green)
**Secondary Color:** #FFC107 (Gold/Amber - Championship gold)
**Accent Color:** #FF6F00 (Orange - Energy/Hanuman reference)
**Background Light:** #FAFAFA
**Background Dark:** #121212
**Surface Light:** #FFFFFF
**Surface Dark:** #1E1E1E

## Screen List & Layout

### 1. Login Screen
Full-screen with academy logo at top, role-based login form (email + password), role selector (Player/Coach/Head Coach/Admin). Green gradient background with tennis motif.

### 2. Player Screens

#### 2.1 Player Home (Tab: Home)
Top section: Welcome greeting with player name + avatar. Quick stats cards in horizontal scroll: Training streak, Weekly hours, Current fitness score, Risk status badge. Below: Today's schedule card, Recent check-in status, Quick action buttons (Check-in, Self Report).

#### 2.2 Daily Check-in (Modal/Screen)
Clean form with date auto-filled. Fields: Training hours (number input), Fatigue slider (1-10), Confidence slider (1-10), Stress slider (1-10), Injury status toggle + description, Strength feeling (text), Weakness feeling (text), Next goal (text). Submit button at bottom.

#### 2.3 My Progress (Tab: Progress)
Top: Performance radar chart (Technique, Fitness, Tactics, Mental, MatchIQ). Middle: Trend line chart showing weekly scores over time. Bottom: List of recent coach evaluations with expandable details. KPI cards: Performance Index, Readiness Index, Peak Index.

#### 2.4 Match Stats (Tab: Matches)
List of matches with date, opponent, result. Tap to see details: Serve %, Winners, Unforced Errors, Win/Loss. Add match button for recording new match data.

#### 2.5 My Reports (Tab: Reports)
List of AI-generated reports with date and type (Weekly/Monthly/Tournament). Tap to view: Executive Summary, Strengths, Weaknesses, Action Plan, Goals.

#### 2.6 Player Profile
Avatar, name, level, program, assigned coach. Settings: notification preferences, theme toggle.

### 3. Coach Screens

#### 3.1 Coach Home (Tab: Home)
Welcome with coach name. Team overview cards: Total players, Pending evaluations, High-risk alerts. Today's evaluation queue. Quick action: Evaluate Player button.

#### 3.2 Player Evaluation Form (Screen)
Select player from dropdown. Score sliders (1-10): Technique, Fitness, Tactics, Mental, Discipline, MatchIQ. Text fields: Strength notes, Weakness notes, Coach comment. Evaluation type selector (Weekly/Monthly/Tournament). Submit button.

#### 3.3 My Team (Tab: Team)
List of assigned players with avatar, name, level, last evaluation date, risk badge. Tap to view player detail with full history.

#### 3.4 Player Detail (Screen)
Player profile header. Tabs: Overview (radar + KPIs), Check-ins (history), Evaluations (coach history), Matches, Reports.

#### 3.5 Coach Notes (Tab: Notes)
Personal coaching notes organized by player and date. Add/edit notes with rich text.

### 4. Head Coach / Manager Screens

#### 4.1 Dashboard Home (Tab: Dashboard)
Command Center: Overall academy performance score, Total active players, Average risk index, Number of high-risk players (red badge). Charts: Performance distribution bar chart, Risk heatmap.

#### 4.2 Player 360° View (Screen)
Full player analysis: Radar chart, Trend lines, Latest AI summary, Risk indicators, Coach evaluation history.

#### 4.3 Tournament Dashboard (Tab: Tournament)
Tournament mode selector. Win/Loss records, Serve efficiency, Overall team performance. Player comparison table.

#### 4.4 Coach Analysis (Tab: Coaches)
List of coaches with their team stats. Improvement rate per coach, Risk distribution per coach. Tap for detailed coach performance view.

#### 4.5 All Players (Tab: Players)
Searchable/filterable list of all players. Filter by: Level, Program, Coach, Risk status. Sort by: Performance index, Name, Recent activity.

### 5. Admin Screens

#### 5.1 User Management
CRUD for all users (Players, Coaches, Head Coaches). Assign coaches to players. Set programs and levels.

#### 5.2 Academy Settings
Academy profile, Programs management, Level definitions.

## Key User Flows

### Flow 1: Player Daily Check-in
Player opens app → Home tab → Tap "Check-in" → Fill daily form → Submit → See confirmation → Home updates with today's check-in status.

### Flow 2: Coach Evaluates Player
Coach opens app → Home tab → Tap "Evaluate" or select from queue → Choose player → Fill evaluation form → Submit → Player gets notification → Report generated.

### Flow 3: Head Coach Reviews Dashboard
Head Coach opens app → Dashboard tab → View command center → Tap high-risk player → See Player 360° view → Review AI report → Make coaching decisions.

### Flow 4: View Progress Report
Any role opens Reports → Select report → View Executive Summary, Strengths, Weaknesses, Action Plan, Goals.

## Tab Bar Configuration

### Player Tabs
1. Home (house icon)
2. Progress (chart icon)
3. Matches (trophy icon)
4. Reports (document icon)

### Coach Tabs
1. Home (house icon)
2. Team (people icon)
3. Evaluate (clipboard icon)
4. Notes (edit icon)

### Head Coach Tabs
1. Dashboard (grid icon)
2. Players (people icon)
3. Tournament (trophy icon)
4. Coaches (person icon)

### Admin Tabs
1. Dashboard (grid icon)
2. Users (people icon)
3. Settings (gear icon)

## Color Choices (Specific)

| Element | Light | Dark |
|---------|-------|------|
| Primary (Green) | #1B5E20 | #4CAF50 |
| Secondary (Gold) | #F57F17 | #FFC107 |
| Background | #FAFAFA | #121212 |
| Surface/Card | #FFFFFF | #1E1E1E |
| Text Primary | #212121 | #F5F5F5 |
| Text Secondary | #757575 | #BDBDBD |
| Border | #E0E0E0 | #333333 |
| Success | #2E7D32 | #66BB6A |
| Warning | #F57F17 | #FFB74D |
| Error | #C62828 | #EF5350 |
| Risk High | #C62828 | #EF5350 |
| Risk Medium | #F57F17 | #FFB74D |
| Risk Low | #2E7D32 | #66BB6A |
