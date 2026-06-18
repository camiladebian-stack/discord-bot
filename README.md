# Discord Bot

Production-grade Discord bot built with Node.js, TypeScript, and discord.js v14.

## Features

- **Modular architecture** - Commands, events, middleware, services
- **Slash commands** - Full interaction-based command system
- **Middleware pipeline** - Cooldowns, rate limiting, anti-spam, permissions
- **Database** - SQLite via better-sqlite3 (leveling, economy, warnings, tickets, reminders)
- **Logging** - Winston with file rotation and structured JSON output
- **Health monitoring** - HTTP health check and Prometheus metrics endpoint
- **Graceful shutdown** - SIGINT/SIGTERM handling with cleanup
- **Command registration** - Dev guild (instant) and global modes
- **XP/Leveling** - Per-guild XP tracking with leaderboard support
- **Moderation** - Kick, ban, warning system
- **Configuration** - Zod-validated environment variables

## Quick Start

```bash
# Clone and install
git clone <repo-url> && cd discord-bot
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Discord bot token and client ID

# Register slash commands
npm run register

# Start bot
npm run start
```

## Project Structure

```
src/
  bot.ts                  # Entry point
  config/index.ts         # Environment config (Zod validation)
  commands/               # Slash command implementations
    index.ts              # Command loader
    ping.ts               # Ping/latency command
    info.ts               # Bot/user/guild info
    moderation/           # Kick, ban, etc.
    utility/              # Avatar, server info
  events/                 # Discord event handlers
    index.ts              # Event registrar
    ready.ts              # On ready (status, DB init)
    interactionCreate.ts  # Command execution pipeline
    guildCreate.ts        # Guild join handler
  middlewares/            # Command execution pipeline
    index.ts              # Pipeline runner
    cooldown.ts           # Per-command cooldowns
    rateLimit.ts          # User rate limiting
    antiSpam.ts           # Spam detection
    permissions.ts        # Permission checks
  services/
    logger.ts             # Winston logger
    database.ts           # SQLite database layer
    health.ts             # HTTP health server
  types/index.ts          # TypeScript type definitions
  utils/                  # Validation, formatting helpers
  scripts/register.ts     # Slash command registration script
```

## Commands

| Command | Description | Category |
|---------|-------------|----------|
| `/ping` | Bot latency and uptime | utility |
| `/info bot` | Bot statistics | utility |
| `/info user [target]` | User information | utility |
| `/info guild` | Server information | utility |
| `/avatar [target]` | User avatar | utility |
| `/server info` | Server overview | utility |
| `/server roles` | Server roles list | utility |
| `/server channels` | Server channels list | utility |
| `/kick <target> [reason]` | Kick a member | moderation |
| `/ban <target> [reason] [days]` | Ban a user | moderation |

## Configuration

All configuration via environment variables (see `.env.example`):

- `DISCORD_TOKEN` - Bot token (required)
- `CLIENT_ID` - Application client ID (required)
- `DEV_GUILD_ID` - Guild ID for instant command registration (optional)
- `OWNER_ID` - Bot owner Discord user ID (optional)
- `LOG_LEVEL` - Logging verbosity: error, warn, info, debug
- `HEALTH_PORT` - Health check HTTP server port (default: 8080)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run start` | Start compiled bot |
| `npm run dev` | Run with hot reload (tsx watch) |
| `npm run register` | Register slash commands |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm run clean` | Remove dist/ |

## API Recommendations

| Service | Free Tier | Use Case |
|---------|-----------|----------|
| OpenRouter | Multiple models, pay-per-token | AI chat |
| Unsplash | 50 req/hour | Images |
| Jikan API | Unlimited, no auth | Anime |
| Open-Meteo | Unlimited, no API key | Weather |
| Free Dictionary API | Unlimited, no auth | Dictionary |
| LibreTranslate | Self-hosted free | Translation |
| Nominatim | 1 req/second | Geolocation |

## Database

SQLite via `better-sqlite3`:

- Zero configuration, no external process
- WAL mode for concurrent reads
- Single file, easy backup
- Suitable for 100+ guilds
- Upgrade path: SQLite -> PostgreSQL when scaling beyond SQLite limits

## Deployment

Free 24/7 options (recommended: Koyeb or Fly.io):

1. Push to GitHub
2. Connect to Koyeb/Fly.io
3. Set environment variables
4. Build command: `npm install && npm run build`
5. Start command: `npm run start`

See `docs/DEPLOYMENT.md` for detailed instructions.

## Monitoring

- HTTP health: `GET /health` returns JSON status
- Prometheus metrics: `GET /metrics` returns text format
- File logging: `logs/combined.log` and `logs/error.log`
- Console logging with colorized output

## License

MIT
