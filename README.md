# PacePlanner

A production-grade Next.js 14 application that connects to Canvas (Instructure) instances to help students plan and manage their assignments with AI-powered time estimation and automatic task breakdown.

## Features

- **Canvas Integration**: Connect to any Canvas instance using personal access tokens
- **Smart Planning**: AI estimates time requirements and breaks assignments into daily subtasks
- **Flexible Scheduling**: Drag-and-drop interface for rescheduling tasks
- **Work Windows**: Customize available work times for each day of the week
- **Catch-up Logic**: Automatic reflow of incomplete tasks when you fall behind
- **Security**: Encrypted token storage with AES-GCM encryption

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd PacePlanner
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and generate your encryption keys:
   ```bash
   # Generate encryption key
   node -e "console.log('base64:' + require('crypto').randomBytes(32).toString('base64'))"
   
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Add your OpenAI key (required for AI estimates)
   echo "OPENAI_API_KEY=sk-..." >> .env.local
   ```

3. **Set up the database:**
   ```bash
   pnpm prisma db push
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## AI Estimates

- Toggle on **Use AI Estimates** under **Settings -> Planning** to allow the dashboard to call the OpenAI API.
- Click **AI Estimate** on any assignment card to trigger `/api/assignments/[id]/estimate`.
- The API expects `OPENAI_API_KEY` (and optional `OPENAI_ESTIMATE_MODEL`) in your environment.
- The server stores the returned minutes, regenerates subtasks, and reports the reasoning back to the UI.

## Getting a Canvas Token

1. Log into your Canvas account
2. Go to **Account** → **Settings**
3. Scroll down to **"Approved Integrations"**
4. Click **"+ New Access Token"**
5. Give it a name like "PacePlanner"
6. Set expiration date (optional)
7. Click **"Generate Token"**
8. Copy the token immediately (you won't see it again)

## Security Notes

- Canvas tokens are encrypted using AES-GCM before storage
- Tokens are never sent to the client browser
- All Canvas API calls are rate-limited (10 requests/minute per user)
- User sessions use signed JWT cookies

## Revoking Access

To revoke PacePlanner's access to your Canvas account:

1. Go to **Account** → **Settings** in Canvas
2. Find the "PacePlanner" token in **"Approved Integrations"**
3. Click **"Delete"** next to the token

## Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── connect/           # Canvas connection page
│   ├── dashboard/         # Main dashboard
│   └── settings/          # User settings
├── components/            # React components
├── lib/                   # Core utilities
│   ├── canvas.ts         # Canvas API client
│   ├── crypto.ts         # Encryption utilities
│   ├── dates.ts          # Date/time helpers
│   ├── planner.ts        # Core planning algorithms
│   └── validators.ts     # Zod schemas
├── prisma/               # Database schema
└── tests/                # Unit tests
```

## API Endpoints

- `POST /api/connect` - Connect to Canvas
- `POST /api/sync` - Sync assignments from Canvas
- `GET /api/canvas/upcoming` - Get upcoming subtasks
- `GET /api/canvas/overdue` - Check for overdue items
- `POST /api/plan/recompute` - Recompute task schedule

## Development

### Running Tests
```bash
pnpm test
```

### Database Management
```bash
# View database in Prisma Studio
pnpm db:studio

# Reset database
pnpm prisma db push --force-reset
```

### Building for Production
```bash
pnpm build
pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
