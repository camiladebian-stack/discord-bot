# Installation Guide

## Prerequisites

### Windows

1. **Install Node.js**

   Download the LTS installer from https://nodejs.org/ (v18 or higher).
   Run the installer. Ensure "Add to PATH" is checked.

   Verify installation:
   ```powershell
   node --version
   npm --version
   ```

2. **Install Git**

   Download from https://git-scm.com/download/win
   Run the installer with default options.

   Verify:
   ```powershell
   git --version
   ```

### Linux (Ubuntu/Debian)

```bash
# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Verify
node --version
npm --version
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install -y nodejs git
```

### macOS

```bash
# Using Homebrew
brew install node git

# Verify
node --version
npm --version
```

## Project Setup

### 1. Clone or Create the Project

```bash
git clone <your-repo-url> discord-bot
cd discord-bot
```

If you are starting from the template repository:

```bash
git clone https://github.com/yourusername/discord-bot.git
cd discord-bot
```

### 2. Install Dependencies

```bash
npm install
```

This installs all production and development dependencies defined in `package.json`.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```ini
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
DEV_GUILD_ID=your_dev_server_id  # Optional: for instant command updates
```

### 4. Compile TypeScript

```bash
npm run build
```

This compiles `src/` to `dist/`.

### 5. Register Slash Commands

```bash
npm run register
```

If `DEV_GUILD_ID` is set, commands register only in that guild (instant). Otherwise, they register globally (up to 1 hour propagation).

### 6. Start the Bot

```bash
npm run start
```

For development with hot reload:

```bash
npm run dev
```

## Verifying the Installation

Check `logs/combined.log` after starting:

```bash
# On Linux/macOS
tail -f logs/combined.log

# On Windows PowerShell
Get-Content -Path logs/combined.log -Tail 10 -Wait
```

You should see:

```
2025-01-01 12:00:00.000 INFO: Loaded 6 commands
2025-01-01 12:00:00.000 INFO: Starting bot: MyBot
2025-01-01 12:00:00.000 INFO: Logged in as BotName#1234
2025-01-01 12:00:00.000 INFO: Serving 1 guilds
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `DISCORD_TOKEN is required` | Create `.env` from `.env.example` and add your token |
| `Cannot find module` | Run `npm install` |
| TypeScript compilation errors | Run `npm run typecheck` to see errors |
| Commands not showing | Run `npm run register` and wait (global commands take up to 1 hour) |
| `Missing Access` | Ensure bot has correct intents and permissions |
| SQLite errors | Ensure `data/` directory is writable |

## Updating

```bash
git pull                          # Get latest code
npm install                       # Update dependencies
npm run build                     # Recompile
npm run register                  # Update commands if changed
```

## Uninstalling

```bash
# Stop the bot (Ctrl+C)
npm run clean                     # Remove compiled files
rm -rf node_modules               # Remove dependencies
rm -rf data logs                  # Remove data and logs (backup first!)
```
