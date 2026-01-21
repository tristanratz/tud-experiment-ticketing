# Quick Start Guide

Get the experimental platform running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Terminal/Command line access

## Setup Steps

### 1. Install Dependencies (if not already done)

```bash
npm install
```

### 2. Configure Environment (Optional)

The `.env.local` file has been created with default values. You can:

- Leave PostHog disabled (default)
- Change the `ADMIN_KEY` to a secure value for production

### 3. Start Development Server

```bash
npm run dev
```

The server will start at [http://localhost:3000](http://localhost:3000)

### 4. Test the Application

⚠️ **Important:** You MUST include `?group=X` in the URL (where X is 1-4). Without it, you'll see "Invalid access link" error.

Open your browser and test each experimental group:

**Group 1 - Knowledge Base:**
```
http://localhost:3000?group=1&timing=immediate
```

**Group 2 - AI Chat Assistant:**
```
http://localhost:3000?group=2&timing=immediate
```

**Group 3 - AI Agent (Step Confirmation):**
```
http://localhost:3000?group=3&timing=staggered
```

**Group 4 - Autonomous AI Agent:**
```
http://localhost:3000?group=4&timing=immediate
```

**Don't forget:** The `?group=X` parameter is required! This simulates real research study links where participants are assigned to specific experimental conditions.

## Testing Workflow

1. **Landing Page**: Accept terms and click "Start Experiment"
2. **Experiment**:
   - Process tickets (15-minute timer)
   - Make decisions and write responses
   - Use group-specific features (knowledge base, chat, AI agents)
3. **Survey**: Complete the post-experiment questionnaire
4. **Complete**: View completion page

## Viewing Collected Data

Data is stored in `data/collected/` as JSON files:
- `[participantId]_trace.json` - All interaction events
- `[participantId]_survey.json` - Survey responses
- `contacts.json` - Email contacts (if provided)

### Export Data

**JSON Export:**
```bash
curl "http://localhost:3000/api/export?key=change_this_to_a_secure_random_key&format=json"
```

**CSV Export:**
```bash
curl "http://localhost:3000/api/export?key=change_this_to_a_secure_random_key&format=csv" > data.csv
```

## Common Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Troubleshooting

### Port Already in Use
If port 3000 is taken, specify a different port:
```bash
PORT=3001 npm run dev
```

### Clear Test Data
To reset between tests:
```bash
rm -rf data/collected/*
```

Also clear browser LocalStorage:
- Open DevTools (F12)
- Go to Application > Local Storage
- Right-click > Clear

### Knowledge Base Not Loading
Ensure markdown files exist:
```bash
ls -la data/knowledge/
```

## Next Steps

- Review [README.md](./README.md) for full documentation
- Customize tickets in `data/tickets.json`
- Add knowledge base content to `data/knowledge/`
- Configure PostHog for production analytics
- Set up proper authentication for data export

## Production Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables:
   - `ADMIN_KEY`: Secure random string
   - `NEXT_PUBLIC_POSTHOG_KEY`: Your PostHog project key (optional)

3. Start with:
   ```bash
   npm start
   ```

Or deploy to a platform like:
- Vercel: `vercel deploy`
- Docker: See deployment documentation
- Traditional server: Use PM2 or similar process manager

## Support

Questions? Check:
- [README.md](./README.md) - Full documentation
- [SPECIFICATION.md](./SPECIFICATION.md) - Original requirements
- Console logs in DevTools for errors
- Network tab for API issues

---

**Ready to start?** Run `npm run dev` and open http://localhost:3000?group=1&timing=immediate
