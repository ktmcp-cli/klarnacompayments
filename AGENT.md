# AGENT.md — Klarna Payments API V1 CLI for AI Agents

This document explains how to use the Klarna Payments API V1 CLI as an AI agent.

## Overview

The `klarnacompayments` CLI provides access to the Klarna Payments API V1 API.

## Prerequisites

```bash
klarnacompayments config set --api-key <key>
```

## All Commands

### Config

```bash
klarnacompayments config set --api-key <key>
klarnacompayments config set --base-url <url>
klarnacompayments config show
```

### API Calls

```bash
klarnacompayments call            # Make API call
klarnacompayments call --json     # JSON output for parsing
```

## Tips for Agents

1. Always use `--json` when parsing results programmatically
2. Check `klarnacompayments --help` for all available commands
3. Configure API key before making calls
