# AGENT.md — Klarna Payments API CLI for AI Agents

This document explains how to use the Klarna Payments API CLI as an AI agent.

## Overview

The `klarnacompayments` CLI provides access to Klarna's payment processing API. Use it to create payment sessions, manage authorizations, capture orders, and process refunds.

## Prerequisites

The CLI must be configured with API credentials before use:

```bash
klarnacompayments config set --username <user> --password <pass>
klarnacompayments config set --region <region>  # eu, na, or oc
```

## All Commands

### Config

```bash
klarnacompayments config set --username <user> --password <pass>
klarnacompayments config set --region <region>
klarnacompayments config show
```

### Sessions

```bash
# Create session
klarnacompayments sessions create \
  --amount 10000 \
  --lines '[{"name":"Product","quantity":1,"unit_price":10000,"total_amount":10000}]' \
  --country US \
  --currency USD \
  --locale en-US

# Get session
klarnacompayments sessions get <session-id>

# Update session
klarnacompayments sessions update <session-id> --amount 15000 --lines '[...]'
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
# Get order
klarnacompayments orders get <order-id>

# Capture order
klarnacompayments orders capture <order-id> --amount 10000 --description "Full capture"

# Update order lines
klarnacompayments orders update <order-id> --amount 15000 --lines '[...]'
```

### Refunds

```bash
# Create refund
klarnacompayments refunds create <order-id> --amount 5000 --description "Partial refund"

# List refunds
klarnacompayments refunds list <order-id>
```

## JSON Output

All commands support `--json` for structured output. Always use `--json` when parsing results programmatically:

```bash
klarnacompayments sessions create --amount 10000 --lines '[...]' --json
klarnacompayments orders get <order-id> --json
klarnacompayments refunds list <order-id> --json
```

## Order Lines Format

Order lines must be a JSON array:

```json
[
  {
    "name": "Product Name",
    "quantity": 1,
    "unit_price": 10000,
    "total_amount": 10000
  }
]
```

Amounts are in minor units (e.g., 10000 = $100.00 for USD).

## Example Workflows

### Create and capture payment

```bash
# Create session
SESSION_ID=$(klarnacompayments sessions create \
  --amount 10000 \
  --lines '[{"name":"Widget","quantity":1,"unit_price":10000,"total_amount":10000}]' \
  --json | jq -r '.session_id')

# After customer payment, create authorization
ORDER_ID=$(klarnacompayments authorizations create <auth-token> \
  --amount 10000 \
  --lines '[...]' \
  --json | jq -r '.order_id')

# Capture order
klarnacompayments orders capture $ORDER_ID --amount 10000 --json
```

### Process refund

```bash
# Check order status
klarnacompayments orders get <order-id> --json

# Create refund
klarnacompayments refunds create <order-id> --amount 3000 --description "Partial refund" --json
```

## Tips for Agents

1. Always use `--json` when you need to extract specific fields
2. Amounts are always in minor units (cents for USD)
3. Order lines must include name, quantity, unit_price, and total_amount
4. Authorizations must be captured before funds are transferred
5. Partial captures and refunds are supported
6. Region affects which API endpoint is used (EU, NA, OC)
