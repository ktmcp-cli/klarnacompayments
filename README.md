# Klarna Payments API CLI

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

A production-ready command-line interface for the Klarna Payments API. Create payment sessions, manage authorizations, capture orders, and process refunds directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by Klarna.

## Features

- **Payment Sessions** — Create and manage payment sessions
- **Authorizations** — Handle payment authorizations
- **Orders** — Capture and update orders
- **Refunds** — Process refunds for captured orders
- **Multi-region** — Support for EU, NA, and OC regions
- **JSON output** — All commands support `--json` for scripting

## Why CLI > MCP

MCP servers are complex, stateful, and require a running server process. A CLI is:

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe output to `jq`, `grep`, `awk`, and other tools
- **Scriptable** — Use in shell scripts, CI/CD pipelines, cron jobs
- **Debuggable** — See exactly what's happening with `--json` flag
- **AI-friendly** — AI agents can call CLIs just as easily as MCPs, with less overhead

## Installation

```bash
npm install -g @ktmcp-cli/klarnacompayments
```

## Authentication Setup

Configure your Klarna API credentials:

```bash
klarnacompayments config set --username YOUR_USERNAME --password YOUR_PASSWORD
```

Set region (optional, defaults to EU):

```bash
klarnacompayments config set --region eu  # or na, oc
```

## Commands

### Configuration

```bash
# Set credentials
klarnacompayments config set --username <user> --password <pass>

# Set region
klarnacompayments config set --region <region>

# Show current config
klarnacompayments config show
```

### Sessions

```bash
# Create payment session
klarnacompayments sessions create \
  --amount 10000 \
  --lines '[{"name":"Product","quantity":1,"unit_price":10000,"total_amount":10000}]'

# Get session details
klarnacompayments sessions get <session-id>

# Update session
klarnacompayments sessions update <session-id> \
  --amount 15000 \
  --lines '[{"name":"Product","quantity":1,"unit_price":15000,"total_amount":15000}]'
```

### Authorizations

```bash
# Create authorization
klarnacompayments authorizations create <auth-token> \
  --amount 10000 \
  --lines '[{"name":"Product","quantity":1,"unit_price":10000,"total_amount":10000}]'

# Get authorization
klarnacompayments authorizations get <auth-token>

# Cancel authorization
klarnacompayments authorizations cancel <auth-token>
```

### Orders

```bash
# Get order details
klarnacompayments orders get <order-id>

# Capture order
klarnacompayments orders capture <order-id> --amount 10000 --description "Full capture"

# Update order lines
klarnacompayments orders update <order-id> \
  --amount 15000 \
  --lines '[{"name":"Updated","quantity":1,"unit_price":15000,"total_amount":15000}]'
```

### Refunds

```bash
# Create refund
klarnacompayments refunds create <order-id> --amount 5000 --description "Partial refund"

# List refunds
klarnacompayments refunds list <order-id>
```

## JSON Output

All commands support `--json` for machine-readable output:

```bash
# Create session as JSON
klarnacompayments sessions create --amount 10000 --lines '[...]' --json

# Get order details as JSON
klarnacompayments orders get <order-id> --json

# Pipe to jq for filtering
klarnacompayments orders get <order-id> --json | jq '.order_amount'
```

## Examples

### Complete payment flow

```bash
# 1. Create session
SESSION=$(klarnacompayments sessions create \
  --amount 10000 \
  --lines '[{"name":"Widget","quantity":1,"unit_price":10000,"total_amount":10000}]' \
  --json | jq -r '.session_id')

# 2. Customer completes payment and you get auth token
AUTH_TOKEN="<token-from-klarna-widget>"

# 3. Create authorization
ORDER_ID=$(klarnacompayments authorizations create $AUTH_TOKEN \
  --amount 10000 \
  --lines '[{"name":"Widget","quantity":1,"unit_price":10000,"total_amount":10000}]' \
  --json | jq -r '.order_id')

# 4. Capture the order
klarnacompayments orders capture $ORDER_ID --amount 10000 --description "Order fulfilled"
```

### Process refund

```bash
# Get order details
klarnacompayments orders get <order-id> --json

# Issue partial refund
klarnacompayments refunds create <order-id> --amount 3000 --description "Item return"

# List all refunds
klarnacompayments refunds list <order-id>
```

## Contributing

Issues and pull requests are welcome at [github.com/ktmcp-cli/klarnacompayments](https://github.com/ktmcp-cli/klarnacompayments).

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.
