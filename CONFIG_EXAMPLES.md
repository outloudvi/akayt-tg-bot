# Configuration Examples

This file contains example configurations for different scenarios.

## Complete wrangler.jsonc Example

```jsonc
/**
 * For more details on how to configure Wrangler, refer to:
 * https://developers.cloudflare.com/workers/wrangler/configuration/
 */
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "super-tree-51b3",
	"main": "src/index.ts",
	"compatibility_date": "2025-12-02",
	"compatibility_flags": [
		"global_fetch_strictly_public"
	],
	"assets": {
		"directory": "./public"
	},
	"observability": {
		"enabled": true
	},
	
	/**
	 * KV Namespaces
	 * These must match the IDs from your wrangler kv:namespace create output
	 */
	"kv_namespaces": [
		{
			"binding": "LINKS_KV",
			"id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
			"preview_id": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4"
		}
	],
	
	/**
	 * Environment Variables
	 * Used for non-sensitive configuration
	 */
	"vars": {
		"WORKER_URL": "https://super-tree-51b3.workers.dev"
	},
	
	/**
	 * Production Environment Override
	 */
	"env": {
		"production": {
			"vars": {
				"WORKER_URL": "https://super-tree-51b3.workers.dev"
			},
			"kv_namespaces": [
				{
					"binding": "LINKS_KV",
					"id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
					"preview_id": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4"
				}
			]
		}
	}
}
```

## Development Setup

### 1. Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Link shortener bot setup"
```

### 2. Create .gitignore
```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.wrangler/
.env
.env.local
*.log
.DS_Store
EOF
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Generate Cloudflare Types
```bash
pnpm cf-typegen
```

## Secret Management

### Set the Telegram Bot Token

Interactive prompt:
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your token when prompted
```

Using pipe:
```bash
echo "YOUR_BOT_TOKEN_HERE" | wrangler secret put TELEGRAM_BOT_TOKEN
```

From environment variable:
```bash
wrangler secret put TELEGRAM_BOT_TOKEN --env production < <(echo $TELEGRAM_BOT_TOKEN)
```

### List All Secrets
```bash
wrangler secret list
```

### Delete a Secret
```bash
wrangler secret delete TELEGRAM_BOT_TOKEN
```

## Deployment Configuration

### Development Deployment
```bash
# Deploy to development
pnpm deploy --env development
```

### Production Deployment
```bash
# Deploy to production
pnpm deploy --env production

# After first deployment, update WORKER_URL in wrangler.jsonc
```

## Testing Configuration

### Run All Tests
```bash
pnpm test
```

### Run Specific Test File
```bash
pnpm test test/index.spec.ts
```

### Run Tests in Watch Mode
```bash
pnpm test --watch
```

### Generate Coverage Report
```bash
pnpm test --coverage
```

## Local Development

### Start Local Server
```bash
pnpm dev
```

The server will run at `http://localhost:8787`

### Test Webhook Locally

```bash
# Create a short URL
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "chat": {"id": 12345, "type": "private", "first_name": "Test"},
      "from": {"id": 12345, "is_bot": false, "first_name": "Test"},
      "date": 1234567890,
      "text": "/create test https://example.com"
    }
  }'
```

### Test Redirect Locally

```bash
# Add a test entry to local KV
# Then test the redirect
curl -L http://localhost:8787/test
```

## Custom Domain Setup

To use a custom domain instead of `.workers.dev`:

1. Add your custom domain in Cloudflare Dashboard
2. Create a route in `wrangler.jsonc`:

```jsonc
{
  "routes": [
    {
      "pattern": "short.yourdomain.com/*",
      "zone_name": "yourdomain.com"
    }
  ]
}
```

3. Update `WORKER_URL` variable:
```jsonc
"vars": {
  "WORKER_URL": "https://short.yourdomain.com"
}
```

4. Redeploy:
```bash
pnpm deploy
```

## Analytics and Monitoring

### View Worker Logs
```bash
wrangler tail
```

### Real-time Log Streaming
```bash
wrangler tail --format pretty
```

### Filter Logs
```bash
# Show only errors
wrangler tail --status error

# Show only successful responses
wrangler tail --status ok

# Follow logs for specific status
wrangler tail -f --status ok
```

## KV Database Management

### List KV Namespaces
```bash
wrangler kv:namespace list
```

### View All Keys in Namespace
```bash
wrangler kv:key list --binding=LINKS_KV
```

### Get a Specific Value
```bash
wrangler kv:key list --binding=LINKS_KV | grep "google"
wrangler kv:key get google --binding=LINKS_KV
```

### Delete a Key from KV
```bash
wrangler kv:key delete google --binding=LINKS_KV
```

### Clear Entire Namespace
```bash
# Warning: This cannot be undone
wrangler kv:namespace delete --binding=LINKS_KV
```

## Webhook Registration

### Register Webhook
```bash
TOKEN="YOUR_BOT_TOKEN"
WEBHOOK_URL="https://your-worker.workers.dev/webhook"

curl -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}"
```

### Get Webhook Info
```bash
TOKEN="YOUR_BOT_TOKEN"

curl "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"
```

### Delete Webhook
```bash
TOKEN="YOUR_BOT_TOKEN"

curl -X POST "https://api.telegram.org/bot${TOKEN}/deleteWebhook"
```

## Performance Optimization

### Reduce Bundle Size
The bot uses tree-shaking. Ensure unused imports are removed:

```typescript
// Good - only import what you use
import { Bot, webhookCallback } from 'grammy';

// Bad - imports entire grammy package
import * as grammy from 'grammy';
```

### Cache Control
Set appropriate cache headers for redirects:

```typescript
return Response.redirect(targetUrl, 302, {
	headers: {
		'Cache-Control': 'no-cache'
	}
});
```

## Rollback

If you need to revert to a previous version:

```bash
# View recent deployments
wrangler deployments list

# Rollback to specific deployment ID
wrangler rollback --message "Rollback reason"
```

## Environment Variables for Different Environments

Development:
```jsonc
"env": {
  "development": {
    "vars": {
      "WORKER_URL": "http://localhost:8787"
    }
  }
}
```

Staging:
```jsonc
"env": {
  "staging": {
    "vars": {
      "WORKER_URL": "https://staging-short.workers.dev"
    },
    "kv_namespaces": [...]
  }
}
```

Production:
```jsonc
"env": {
  "production": {
    "vars": {
      "WORKER_URL": "https://short.yourdomain.com"
    },
    "kv_namespaces": [...]
  }
}
```

Deploy to specific environment:
```bash
pnpm deploy --env production
```
