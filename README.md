# Opsy Demo — Notifications Service

A demo showing how [Opsy](https://opsy.sh) lets you create cloud infrastructure and write application code in the same Claude Code session.

## Setup

```bash
bun install
cp .env.example .env
# Fill in AWS credentials and region in .env
```

### Connect Opsy MCP

```bash
claude mcp add --transport http opsy "https://api.opsy.sh/mcp"
```

This gives Claude Code access to create and manage infrastructure through Opsy.

## Run

```bash
bun dev
# Open http://localhost:3100
```

You'll see a notification dashboard with a "Disconnected" status — the SQS queue doesn't exist yet.

## Demo Flow

### 1. Create the SQS queue

In Claude Code, ask:

> "I need an SQS queue for processing notifications. Set it up on our backend stack in dev."

Claude calls Opsy via MCP to create the queue and update IAM permissions. Approve the run in the [Opsy dashboard](https://opsy.sh).

### 2. Wire up the code

Then ask:

> "Write the notification handler that publishes to that queue"

Claude reads the queue URL from the stack outputs and implements the `/notify`, `/messages`, and `/status` endpoints in `src/app.ts`.

### 3. Test it

Restart the dev server (`bun dev`), refresh the page. The status dot should turn green ("Connected"). Type a message, hit Send — it appears in the activity feed.

## Project Structure

```
src/
  index.ts   — Server entry point
  app.ts     — Hono app with dashboard UI and API routes
.env         — AWS credentials and QUEUE_URL (not committed)
CLAUDE.md    — Context for Claude Code
```

## API Endpoints

| Method | Path       | Description                  |
|--------|------------|------------------------------|
| GET    | `/`        | Notification dashboard       |
| GET    | `/status`  | Queue connection status      |
| POST   | `/notify`  | Send a notification to SQS   |
| GET    | `/messages`| List sent notifications      |
| GET    | `/health`  | Health check                 |
