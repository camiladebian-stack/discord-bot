# Deployment Guide

## Free 24/7 Hosting Comparison

| Platform | Free Tier Limits | Sleep Policy | Reliability | Best For |
|----------|------------------|--------------|-------------|----------|
| **Koyeb** | 1 app, 1 GB RAM, shared CPU | Spins down after inactivity | Good | Recommended |
| **Fly.io** | 3 VMs, 256 MB RAM each | Always-on with free allowance | Excellent | Scaling |
| **Railway** | $5 credit (limited hours) | Stops when credit depletes | Good | Short-term |
| **Render** | 750 hours/month (not 24/7) | Spins down after 15 min idle | Good | Non-critical |
| **Oracle Cloud** | 4 ARM cores, 24 GB RAM | Always-free, no sleep | Excellent | Highest resources |
| **Self-host (Raspberry Pi)** | Unlimited | Always-on | Your uptime | Full control |

## Recommended: Koyeb

Koyeb offers the best balance of free tier, reliability, and ease of use.

### Step 1: GitHub Repository

```bash
# Initialize git in your project directory
git init
git add .
git commit -m "Initial commit: production Discord bot"

# Create a repository on GitHub.com
# Then push:
git remote add origin https://github.com/yourusername/discord-bot.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Koyeb

1. Go to https://app.koyeb.com
2. Sign up with GitHub
3. Click "Create App"
4. Select "GitHub" as deployment method
5. Select your repository
6. Configure:

   ```
   Builder: Dockerfile or Buildpacks
   Build Command: npm install && npm run build
   Start Command: npm run start
   App Port: 8080
   ```

7. Add environment variables (all from `.env` except `DEV_GUILD_ID` for production)
8. Deploy

### Alternative: Fly.io

```bash
# Install flyctl
# Windows (PowerShell):
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux/macOS:
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (in project directory)
fly launch

# Set environment variables (one by one)
fly secrets set DISCORD_TOKEN=your_token_here
fly secrets set CLIENT_ID=your_client_id_here

# Scale down to free tier
fly scale memory 256
fly scale count 1

# Deploy
fly deploy
```

`fly.toml` (auto-generated, but ensure this):

```toml
app = "your-app-name"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
```

## Setting Up for Production

### 1. Register Commands Globally

Remove `DEV_GUILD_ID` from your production environment. Global commands take up to 1 hour to propagate.

Run once:
```bash
npm run register
```

### 2. Verify Health Endpoint

```bash
curl https://your-app.koyeb.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "guildCount": 5,
  "userCount": 1500,
  "commandCount": 6,
  "memoryUsage": 45,
  "cpuUsage": 2,
  "databaseStatus": "connected",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 3. Monitoring Setup

**Uptime monitoring** (UptimeRobot, free):
- Monitor type: HTTP(s)
- URL: `https://your-app.koyeb.app/health`
- Interval: 5 minutes
- Alert when: Down

**Logging**:
- Logs are accessible via Koyeb dashboard
- Persistent logs in `logs/` directory
- Error logs are separate in `logs/error.log`

## Updating the Bot

```bash
# 1. Make changes locally
git add .
git commit -m "Description of changes"
git push

# 2. Koyeb auto-deploys on push
# 3. If commands changed, run once after deploy:
npm run register
```

## Restart Procedures

Graceful shutdown is automatic on SIGTERM. To restart manually:

**Koyeb**: Click "Redeploy" in dashboard
**Fly.io**: `fly apps restart`

## Backup

```bash
# Backup database (while bot is running, WAL mode allows reads)
cp data/bot.db backups/bot-$(date +%Y%m%d).db
```

## Scaling

The SQLite database handles hundreds of guilds. When exceeding SQLite limits:

1. Migrate to PostgreSQL (requires code changes)
2. Consider sharding the bot across multiple processes
3. Use Redis for caching and rate limit data

## Production Checklist

- [ ] Remove `DEV_GUILD_ID` or set to empty
- [ ] Register commands globally
- [ ] Verify health endpoint responds
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Backup database regularly
- [ ] Monitor log files for errors
- [ ] Keep dependencies updated (`npm update`)
- [ ] Review permission scopes
- [ ] Test all commands in production
