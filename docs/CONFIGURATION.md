# Configuration Guide

## Environment Variables

All configuration is managed through environment variables defined in `.env`.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | `MTk4NjIyNDgzNDg1OTY1Mjg4.GuF3Tq.` |
| `CLIENT_ID` | Application ID from Discord Developer Portal | `198622483485965288` |

### Optional Variables

#### Bot Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `DEV_GUILD_ID` | empty | Guild ID for instant command registration. Commands appear immediately but only in this guild. Leave empty for global commands (1h cache). |
| `BOT_NAME` | `MyBot` | Bot display name used in logs |
| `BOT_ACTIVITY` | `/help \| v1.0.0` | Status text shown under bot name |
| `BOT_ACTIVITY_TYPE` | `PLAYING` | Activity type: `PLAYING`, `WATCHING`, `LISTENING`, `COMPETING` |
| `OWNER_ID` | empty | Discord user ID for owner-only commands and elevated permissions |

#### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Severity: `error`, `warn`, `info`, `debug` |
| `LOG_FILE` | `logs/combined.log` | Path to combined log file (all levels) |
| `LOG_ERROR_FILE` | `logs/error.log` | Path to error-only log file |

#### Cooldowns & Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `COOLDOWN_DEFAULT` | `3` | Default cooldown in seconds between commands |
| `COOLDOWN_MODERATION` | `5` | Cooldown for moderation commands |
| `RATE_LIMIT_MAX` | `10` | Maximum commands per time window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds (1 minute) |
| `ANTI_SPAM_THRESHOLD` | `5` | Commands within window to trigger spam detection |
| `ANTI_SPAM_WINDOW_MS` | `10000` | Spam detection window in milliseconds (10 seconds) |

#### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `data/bot.db` | SQLite database file path |

#### AI Provider (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | empty | AI provider: `openrouter`, `gemini`, `groq` |
| `AI_MAX_TOKENS` | `1024` | Maximum tokens per AI response |

#### Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `HEALTH_PORT` | `8080` | Port for HTTP health check server |

## Configuration Validation

The configuration is validated at startup using Zod schemas. Invalid or missing required variables cause immediate exit with a descriptive error.

## Discord Developer Portal Settings

1. Go to https://discord.com/developers/applications
2. Select your application
3. **Bot** section:
   - Enable: Presence Intent, Server Members Intent, Message Content Intent
4. **OAuth2 > URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Use Slash Commands`, `Kick Members`, `Ban Members`, `Manage Messages`, `Read Message History`
5. Use the generated URL to invite the bot

## Example Configuration

```ini
# Minimal configuration
DISCORD_TOKEN=MTk4NjIyNDgzNDg1OTY1Mjg4.GuF3Tq.
CLIENT_ID=198622483485965288

# Development: instant command updates in one server
DEV_GUILD_ID=123456789012345678

# Monitoring
HEALTH_PORT=8080

# Higher rate limits
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000

# Stricter anti-spam
ANTI_SPAM_THRESHOLD=3
ANTI_SPAM_WINDOW_MS=15000

# AI features
AI_PROVIDER=openrouter
AI_MAX_TOKENS=2048
```
