# Experimental Ticket System Platform

A web-based experimental platform for research on ticket system interfaces with different AI support levels. Participants process customer support tickets under timed conditions while their behavior is tracked.

## Features

### Four Experimental Groups

1. **Group 1 - Knowledge Base**: Left sidebar with hierarchical, collapsible knowledge base
2. **Group 2 - AI Chat Assistant**: Left sidebar with AI chat for answering questions and drafting responses
3. **Group 3 - AI Agents with Confirmation**: Step-by-step AI agent execution with participant confirmation
4. **Group 4 - Autonomous AI Agents**: Fully automated AI processing with final approval only

### Core Functionality

- **Timed Experiment**: 15-minute sessions with 10 customer support tickets
- **Process Tracking**: Real-time progress bar showing current status and time remaining
- **Two Timing Modes**:
  - Immediate: All tickets visible from start
  - Staggered: Tickets appear on timed schedule
- **Comprehensive Tracking**: Mouse movements, clicks, decisions, and time metrics
- **Post-Experiment Survey**: Measures stress, confidence, self-efficacy, trust, and engagement
- **Data Collection**: Local storage + server sync for reliability

## Tech Stack

- **Frontend**: React + Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context + LocalStorage
- **Backend**: Next.js API Routes
- **Analytics**: PostHog (optional)
- **Data Storage**: JSON files on server

## Project Structure

```
tud-experiment-custom/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Landing page with consent
│   ├── experiment/page.tsx  # Main experiment interface
│   ├── survey/page.tsx      # Post-experiment survey
│   ├── complete/page.tsx    # Completion page
│   └── api/                 # API endpoints
│       ├── knowledge/       # Knowledge base data
│       ├── trace-data/      # Trace event storage
│       ├── survey/          # Survey response storage
│       ├── contact/         # Contact info storage
│       └── export/          # Admin data export
├── components/
│   ├── experiment/          # Experiment UI components
│   │   ├── ProcessBar.tsx
│   │   ├── TicketOverview.tsx
│   │   ├── TicketDetail.tsx
│   │   ├── KnowledgeBase.tsx
│   │   ├── ChatAssistant.tsx
│   │   ├── AIAgentConfirm.tsx
│   │   └── AIAgentAuto.tsx
│   └── survey/
│       └── SurveyForm.tsx
├── lib/                     # Utility libraries
│   ├── tracking.ts         # PostHog + custom tracking
│   ├── tickets.ts          # Ticket logic & scoring
│   ├── knowledge.ts        # Knowledge base parser
│   ├── aiMock.ts           # Mock AI responses
│   └── storage.ts          # LocalStorage wrapper
├── data/
│   ├── tickets.json        # 10 sample tickets
│   ├── knowledge/          # Markdown knowledge base
│   └── collected/          # Server-collected data (gitignored)
└── types/
    └── index.ts            # TypeScript definitions
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git (for version control)

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # PostHog Configuration (optional)
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

   # Admin key for data export (required)
   ADMIN_KEY=your_secret_admin_key_here
   ```

4. **Create data collection directory**
   ```bash
   mkdir -p data/collected
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing Groups

⚠️ **Important:** The application requires a `group` parameter in the URL. Without it, you'll see an "Invalid access link" error.

Test different experimental groups by adding URL parameters:

- Group 1 (Knowledge Base): `http://localhost:3000?group=1&timing=immediate`
- Group 2 (Chat Assistant): `http://localhost:3000?group=2&timing=immediate`
- Group 3 (AI Agent Confirm): `http://localhost:3000?group=3&timing=staggered`
- Group 4 (AI Agent Auto): `http://localhost:3000?group=4&timing=staggered`

**URL Parameters:**
- `group`: `1`, `2`, `3`, or `4` (**required** - validates experimental group assignment)
- `timing`: `immediate` or `staggered` (optional, defaults to `immediate`)

**Common Error:** Accessing `http://localhost:3000` without `?group=X` will show "Invalid access link" - this is intentional to simulate real research study links.

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Data Collection

### Collected Data Types

1. **Trace Events** (`data/collected/[participantId]_trace.json`)
   - Experiment start/end
   - Ticket opened/closed
   - Decisions made (priority, category, assignment)
   - Mouse clicks and movements (sampled)
   - Customer responses sent
   - AI interaction events
   - Knowledge base access

2. **Survey Responses** (`data/collected/[participantId]_survey.json`)
   - Perceived stress (1-10)
   - Decision confidence (1-10)
   - Self-efficacy (1-10)
   - Trust in system (1-10)
   - Trust in self (1-10)
   - Trust in decisions (1-10)
   - Process engagement (1-10)
   - Optional comments

3. **Contact Information** (`data/collected/contacts.json`)
   - Participant ID
   - Email (if provided)
   - Timestamp

### Exporting Data

Access the export endpoint (requires admin key):

**JSON format:**
```
GET /api/export?key=YOUR_ADMIN_KEY&format=json
```

**CSV format:**
```
GET /api/export?key=YOUR_ADMIN_KEY&format=csv
```

The CSV export includes:
- Participant ID
- Ticket count
- Average quality score
- Average error rate
- All survey responses

## Customization

### Adding/Modifying Tickets

Edit `data/tickets.json`:

```json
{
  "id": "T011",
  "customer": "Customer Name",
  "email": "customer@email.com",
  "subject": "Issue subject",
  "description": "Full issue description...",
  "decisionPoints": {
    "priority": ["Low", "Medium", "High", "Urgent"],
    "category": ["Technical", "Account", "Billing", "Order"],
    "assignment": ["Tier 1", "Tier 2", "Specialist"]
  },
  "goldStandard": {
    "priority": "High",
    "category": "Technical",
    "assignment": "Tier 2",
    "responseTemplate": "Ideal customer response..."
  },
  "scheduledAppearance": 900
}
```

### Adding Knowledge Base Content

Add markdown files to `data/knowledge/`:

```
data/knowledge/
├── policies/
│   ├── return-policy.md
│   └── shipping-policy.md
├── technical/
│   ├── account-issues.md
│   └── website-errors.md
└── products/
    └── recommendations.md
```

### Adjusting Experiment Duration

In `app/experiment/page.tsx`, change:
```typescript
const EXPERIMENT_DURATION = 15 * 60; // 15 minutes in seconds
```

### Customizing Survey Questions

Modify `components/survey/SurveyForm.tsx` to add/remove/change survey questions.

## Performance Scoring

The system automatically calculates:

- **Distance from Gold Standard**: How different decisions are from ideal
- **Error Rate**: Percentage of incorrect decisions
- **Quality Score**: Overall ticket quality (0-100)
- **Time Metrics**: Time to first response and time to close

See `lib/tickets.ts` for scoring logic.

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install` to ensure all dependencies are installed

2. **Knowledge base not loading**
   - Verify markdown files exist in `data/knowledge/`
   - Check console for file system errors

3. **Data not persisting**
   - Ensure `data/collected/` directory exists
   - Check file permissions

4. **Timer issues**
   - Clear browser cache and LocalStorage
   - Use incognito/private browsing for testing

### Development Tips

- Use browser DevTools to inspect LocalStorage data
- Check Network tab for API call failures
- Review console for tracking events
- Test with different browsers for compatibility

## Research Ethics

This platform is designed for research purposes. Ensure:

1. **Informed Consent**: Participants understand data collection
2. **Anonymization**: Participant IDs are randomly generated
3. **Right to Withdraw**: Participants can exit at any time
4. **Data Protection**: Secure storage and access controls
5. **IRB Approval**: Obtain necessary ethical approvals

## License

This project is for academic research use. Please cite appropriately if used in publications.

## Support

For technical questions or issues:
- Check the troubleshooting section above
- Review code comments in source files
- Contact: researcher@university.edu

## Acknowledgments

Built with Next.js, React, Tailwind CSS, and PostHog.
