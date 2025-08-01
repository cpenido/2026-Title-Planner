# 2026 Title Marketing Support Planning Tool

A collaborative web-based tool for managing marketing support plans for 2026 title releases with AI-powered recommendations and Excel integration.

## Features

### Title Management
- **Table-based layout** with sortable columns for better data visualization
- Add, edit, and delete title information with enhanced fields
- Track release dates, authors, genres, priority levels, and marketing tiers
- **Excel import functionality** for bulk title addition from publishing calendars
- **AI-powered social following lookup** via Amazon Q/Cedric integration
- **Marketing tier recommendations** based on 2025 performance data
- Visual priority and tier indicators with ranking system

### AI Assistant for Title Selection
- **Intelligent chatbot** for editors and marketers
- Marketing tier recommendations based on author performance
- Social media following analysis and strategies
- Genre-specific marketing approach suggestions
- Budget allocation recommendations
- Campaign timing and coordination advice
- Cross-referencing with historical performance data

### Marketing Planning
- Create comprehensive marketing support plans for each title
- Define campaign strategies and target audiences
- Select marketing channels (Social Media, Email, Influencer Partnerships, PR & Media, Paid Advertising, Events & Signings)
- Set budget allocations and key milestones
- Assign team members to titles
- **Campaign allocation tracking** with Marquee/Blockbuster limits

### Enhanced Data Integration
- **Excel import from 2026 APub US Pub Calendar** with automatic field mapping
- **Cross-reference with 2025 Title Planning data** for tier recommendations
- **Social following auto-population** using AI services
- Author video comfort and audio success tracking
- Regional campaign support (US/UK/Global)

### Team Collaboration
- Multi-user support with user identification
- Real-time activity feed showing all team actions
- Track who created/updated titles and plans
- Collaborative editing of marketing plans

### Data Management
- Automatic local storage of all data
- Persistent data across browser sessions
- Export functionality for backup and sharing
- **Excel file processing** with SheetJS integration

## Getting Started

1. Open `index.html` in a web browser
2. Enter your name in the user field and click "Set User"
3. **Import Excel data** using the "Import Excel" button or add titles manually
4. Use the **AI Assistant** tab to get recommendations for title selection and marketing strategies
5. Create marketing plans by clicking the "Plan" button on any title row
6. Monitor campaign allocation in the "Campaign Allocation" tab
7. Track team activity in the "Team Collaboration" tab

## Usage Guide

### Adding Titles

**Manual Entry:**
1. Click "Add New Title" on the Title Overview tab
2. Fill in the title information:
   - Title name
   - Author
   - Release date
   - Genre
   - Priority level (High/Medium/Low)
   - Marketing tier (auto-determined or manual)
   - Social following (auto-populated via AI)
   - Audio success level
   - Video comfort level
   - Primary region
   - Editorial reason for support
3. Click "Save Title"

**Excel Import:**
1. Click "Import Excel" on the Title Overview tab
2. Select your Excel file (supports .xlsx and .xls)
3. The system will automatically map columns and import titles
4. Social following and marketing tiers are auto-determined based on author data

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

### AI Assistant Usage
1. Navigate to the "AI Assistant" tab
2. Ask questions about:
   - Marketing tier recommendations for specific authors
   - Social media strategies based on following size
   - Budget allocation suggestions
   - Genre-specific marketing approaches
   - Campaign timing and coordination
3. Get data-driven recommendations based on your current title portfolio

### Campaign Allocation Management
1. Use the "Campaign Allocation" tab to monitor limits
2. Set total Marquee and Blockbuster campaign quotas
3. Track usage against limits with visual progress bars
4. Get warnings when approaching capacity

### Collaboration Features
- All team members can see real-time updates
- Activity feed shows who made what changes and when
- Filter marketing plans by specific titles
- Edit existing titles and plans collaboratively
- AI assistant provides consistent recommendations to all users

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Excel Processing**: SheetJS library for .xlsx/.xls file handling
- **AI Integration**: Simulated Amazon Q/Cedric API calls for social data
- **Storage**: Browser localStorage for data persistence
- **Responsive**: Works on desktop and mobile devices with table-based layout
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

## Data Import/Export

### Excel Import
- Supports .xlsx and .xls files
- Automatic column mapping for common fields
- Handles Excel date formats and data types
- Prevents duplicate imports
- Cross-references with 2025 performance data

### Data Export
- JSON export function (accessible via browser console: `app.exportData()`)
- Creates backup of all titles, plans, activities, and chat history
- Includes marketing tier recommendations and social following data

### Excel File Processing
Run `./convert_excel.sh` to convert Excel files to CSV for data analysis.

## AI Assistant Capabilities

The built-in AI assistant provides:
- **Marketing Tier Analysis**: Recommendations based on social following, previous performance, and sales projections
- **Social Media Strategy**: Tailored approaches based on author platform strength
- **Budget Optimization**: Allocation suggestions across campaign types
- **Genre Expertise**: Category-specific marketing recommendations
- **Timing Coordination**: Release schedule optimization
- **Performance Insights**: Analysis of current title portfolio

## Excel Integration

### Supported File Formats
- .xlsx (Excel 2007+)
- .xls (Excel 97-2003)

### Auto-Mapped Fields
- Title/Book Name
- Author/Writer
- Release/Publication Date
- Genre/Category
- Priority/Tier
- Region/Market
- Audio Performance
- Video Comfort
- Social Following
- Expected Sales

## Future Enhancements

Potential improvements for future versions:
- **Real Amazon Q/Cedric integration** for live social data
- **Advanced Excel parsing** with custom field mapping
- **Real-time synchronization** across multiple devices
- **Calendar integration** for milestone tracking
- **Advanced reporting and analytics** with charts
- **Integration with existing marketing tools**
- **Email notifications** for plan updates
- **Machine learning** for improved tier recommendations