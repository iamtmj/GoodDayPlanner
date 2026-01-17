# Good Day Planner

A beautiful, calendar-first activity planner with GitHub-style progress tracking.

## Features

### Calendar-First Planning
- **Interactive Monthly Calendar**: Click any date to plan activities
- **Visual Indicators**: 
  - Dots show days with plans
  - Completion ratios displayed on each date
  - Today is highlighted with a border
  - Selected date is highlighted in black

### Smart Activity Planning
- **Searchable Combobox**: Type to search previous activities or create new ones
- **Plan for Future**: Can plan activities for today and any future date
- **Drag & Drop**: Reorder activities easily
- **Auto-save**: All changes save instantly to localStorage

### Completion Tracking
- **Check Today & Yesterday**: Mark activities complete only for current day and yesterday
- **Locked Dates**: Past dates (except yesterday) are read-only for completion
- **Progress Summary**: See completed/total and percentage for each date

### Dashboard
- **GitHub-Style Heatmap**: 120-day view with red intensity based on completion
- **Stats Cards**: Average score, best day, and total completed (last 30 days)
- **Interactive Tiles**: Click any tile to see details

## Rules

1. **Planning**: Editable for any date ≥ today
   - Today: ✅ Can plan
   - Future dates: ✅ Can plan
   - Past dates: ❌ Read-only

2. **Completion**: Editable ONLY for today and yesterday
   - Today (D): ✅ Can check
   - Yesterday (D-1): ✅ Can check
   - All other dates: ❌ Locked

## Status Badges

- **Planning Open** (Green): Can add/edit activities
- **Check Open** (Blue): Can mark completion
- **Locked** (Red): Read-only

## Usage

1. Open `index.html` in your browser
2. Click a date on the calendar
3. Type an activity name or select from suggestions
4. Press Enter to add
5. Check off completed activities (if date allows)
6. View your progress on the Dashboard

## Design

- **Font**: Sora (fallback for Zalando Sans Expanded)
- **Style**: Notion-inspired black/white minimalist
- **Heatmap**: Red-only intensity (light pink → deep red)
- **Animations**: Subtle micro-interactions throughout

## Data Storage

Everything is stored in localStorage:
- `activityCatalog`: Unique activity names
- `plansByDate`: `{ "YYYY-MM-DD": [{ id, name }] }`
- `completionByDate`: `{ "YYYY-MM-DD": { activityId: boolean } }`

No backend, no auth, no external dependencies!
