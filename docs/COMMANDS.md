# Command Reference

## Utility Commands

### /ping

Check bot latency and response time.

```
Response: Embed with roundtrip time, websocket ping, and uptime
Permission: None
Cooldown: 3 seconds
```

### /info bot

Display bot statistics including server count, user count, uptime, and ping.

```
Response: Embed with bot statistics
Permission: None
Cooldown: 3 seconds
```

### /info user [target]

Display information about a user.

- `target` (optional): User mention or ID. Defaults to yourself.

```
Response: Embed with username, ID, creation date, join date, role count
Permission: None
Cooldown: 3 seconds
```

### /info guild

Display server information.

```
Response: Embed with owner, member count, channels, roles, boosts, creation date
Permission: None
Cooldown: 3 seconds
```

### /avatar [target]

Display a user's avatar in full resolution.

- `target` (optional): User mention or ID. Defaults to yourself.

```
Response: Embed with avatar image (4096px PNG)
Permission: None
Cooldown: 3 seconds
```

### /server info

Detailed server information including channel and member statistics.

```
Response: Embed with comprehensive server statistics
Permission: None
Cooldown: 3 seconds
```

### /server roles

List all roles in the server sorted by position.

```
Response: Embed with role list
Permission: None
Cooldown: 3 seconds
```

### /server channels

Display all channels organized by category.

```
Response: Embed with channel hierarchy
Permission: None
Cooldown: 3 seconds
```

## Moderation Commands

### /kick <target> [reason]

Kick a member from the server.

- `target` (required): Member to kick
- `reason` (optional): Reason for the kick (default: "No reason provided")

```
Response: Embed with kick confirmation
Permission: Kick Members
Cooldown: 5 seconds
```

### /ban <target> [reason] [days]

Ban a user from the server.

- `target` (required): User to ban
- `reason` (optional): Reason for the ban (default: "No reason provided")
- `days` (optional): Delete messages from last N days (0-7, default: 0)

```
Response: Embed with ban confirmation
Permission: Ban Members
Cooldown: 5 seconds
```

## Adding New Commands

1. Create file in `src/commands/` (use category subdirectory if needed)
2. Export a `BotCommand` object with `data` (SlashCommandBuilder) and `execute` function
3. Import and add to the array in `src/commands/index.ts`
4. Run `npm run register` to update Discord
5. Compile: `npm run build`

### Command Template

```typescript
import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from '../types';

export const exampleCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command description')
    .addStringOption((opt) =>
      opt.setName('input').setDescription('An input').setRequired(true)
    ),
  category: 'utility',
  cooldown: 3,

  async execute(interaction) {
    const input = interaction.options.getString('input', true);
    await interaction.reply(`You said: ${input}`);
  },
};
```

## Permissions Reference

| Permission | Value |
|------------|-------|
| Create Instant Invite | 0x00000001 |
| Kick Members | 0x00000002 |
| Ban Members | 0x00000004 |
| Administrator | 0x00000008 |
| Manage Channels | 0x00000010 |
| Manage Guild | 0x00000020 |
| Manage Messages | 0x00002000 |
| Moderate Members | 0x01000000 |
