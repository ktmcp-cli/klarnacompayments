![Banner](https://raw.githubusercontent.com/ktmcp-cli/klarnacompayments/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Klarna Payments API V1 CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with Klarna Payments API V1.

A production-ready command-line interface for Klarna Payments API V1 — The payments API is used to create a session to offer Klarna's payment methods as part of your checkout. As soon as the purchase is completed the order should be read and handled using the Order Management API. Read more on Klarna payments.

## Features

- **Full API Access** — All endpoints accessible via CLI
- **JSON output** — All commands support `--json` for scripting
- **Colorized output** — Clean terminal output with chalk
- **Configuration management** — Store API keys securely

## Installation

```bash
npm install -g @ktmcp-cli/klarnacompayments
```

## Quick Start

```bash
# Configure API key
klarnacompayments config set --api-key YOUR_API_KEY

# Make an API call
klarnacompayments call

# Get help
klarnacompayments --help
```

## Commands

### Config

```bash
klarnacompayments config set --api-key <key>
klarnacompayments config set --base-url <url>
klarnacompayments config show
```

### API Calls

```bash
klarnacompayments call            # Make API call
klarnacompayments call --json     # JSON output
```

## JSON Output

All commands support `--json` for structured output.

## API Documentation

Base URL: `https://api.klarna.com`

For full API documentation, visit the official docs.

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.
