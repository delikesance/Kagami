# Kagami

A Discord bot built with Bun and Discord.js.

## Security & Secrets

This project uses **Bitwarden Secrets Manager (BWS)** to manage sensitive information. Secrets are not stored in `.env` files or hardcoded in the source.

### Required Environment Variables
The following secrets must be configured in your Bitwarden project:
- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`

### Prerequisites
1. [Bitwarden Secrets Manager CLI (`bws`)](https://bitwarden.com/help/secrets-manager-cli/) installed.
2. A valid `BWS_ACCESS_TOKEN`.

## Development

To install dependencies:
```bash
bun install
```

To run the bot in development mode (with watch mode):
```bash
export BWS_ACCESS_TOKEN="your_token"
make dev
```

### Makefile Commands
- `make dev`: Runs the bot with `bun --watch`.
- `make start`: Runs the bot in production mode.

## Project Structure
- `src/index.ts`: Entry point.
- `src/lib/env.ts`: Environment variable validation and access.
- `Makefile`: Secure execution wrapper using `bws run`.
