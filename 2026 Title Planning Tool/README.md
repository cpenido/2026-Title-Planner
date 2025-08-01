# 2026 Title Marketing Support Planning Tool

A collaborative web-based tool for managing marketing support plans for 2026 title releases.

## Features

### Title Management
- Add, edit, and delete title information
- Track release dates, authors, genres, and priority levels
- Visual priority indicators (High/Medium/Low)

### Marketing Planning
- Create comprehensive marketing support plans for each title
- Define campaign strategies and target audiences
- Select marketing channels (Social Media, Email, Influencer Partnerships, PR & Media, Paid Advertising, Events & Signings)
- Set budget allocations and key milestones
- Assign team members to titles

### Team Collaboration
- Multi-user support with user identification
- Real-time activity feed showing all team actions
- Track who created/updated titles and plans
- Collaborative editing of marketing plans

### Data Management
- Automatic local storage of all data
- Persistent data across browser sessions
- Export functionality for backup and sharing

## Getting Started

1. Open `index.html` in a web browser
2. Enter your name in the user field and click "Set User"
3. Start adding titles using the "Add New Title" button
4. Create marketing plans by clicking the "Plan" button on any title card
5. Monitor team activity in the "Team Collaboration" tab

## Usage Guide

### Adding Titles
1. Click "Add New Title" on the Title Overview tab
2. Fill in the title information:
   - Title name
   - Author
   - Release date
   - Genre
   - Priority level (High/Medium/Low)
3. Click "Save Title"

### Creating Marketing Plans
1. Click the "Plan" button on any title card
2. Complete the marketing plan sections:
   - Campaign Strategy: Overall marketing approach
   - Target Audience: Define your audience
   - Marketing Channels: Select applicable channels
   - Budget Allocation: Set marketing budget
   - Key Milestones: Important dates and deadlines
   - Team Members: Assign responsible team members
3. Click "Save Plan"

### Collaboration Features
- All team members can see real-time updates
- Activity feed shows who made what changes and when
- Filter marketing plans by specific titles
- Edit existing titles and plans collaboratively

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage for data persistence
- **Responsive**: Works on desktop and mobile devices
- **No Backend Required**: Runs entirely in the browser

## File Structure

```
2026 Title Planning Tool/
├── index.html          # Main application file
├── styles.css          # Styling and layout
├── script.js           # Application logic and functionality
└── README.md           # This documentation
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Data Export

The tool includes an export function (accessible via browser console: `app.exportData()`) that creates a JSON backup of all titles, plans, and activities.

## Future Enhancements

Potential improvements for future versions:
- Real-time synchronization across multiple devices
- File attachment support for marketing materials
- Calendar integration for milestone tracking
- Advanced reporting and analytics
- Integration with existing marketing tools
- Email notifications for plan updates