# Quick Reference - Link Shortener Bot Commands

## Bot Commands (Send these to the bot on Telegram)

### `/start`
Display welcome message and available commands.
```
/start
```

### `/create`
Create a new short URL with a custom slug.
```
/create [slug] [url]
```

**Examples:**
```
/create google https://google.com
/create gh https://github.com
/create youtube https://www.youtube.com
```

**Response on success:**
```
✅ Short URL created!

Slug: `google`
Short URL: `https://your-worker.workers.dev/google`
Target: `https://google.com`
```

### `/delete`
Delete an existing short URL.
```
/delete [slug]
```

**Examples:**
```
/delete google
/delete gh
```

**Response on success:**
```
✅ Short URL `google` has been deleted.
```

### `/check`
Get information about a short URL.
```
/check [slug]
```

**Examples:**
```
/check google
/check gh
```

**Response on success:**
```
ℹ️ Information for `google`:

Short URL: `https://your-worker.workers.dev/google`
Target: `https://google.com`
```

## Accessing Short URLs

Visit your Worker URL with the slug:
```
https://your-worker.workers.dev/google
```
This will automatically redirect you to the target URL.

## Setup Commands (Terminal/CLI)

### Create KV Namespace
```bash
wrangler kv:namespace create "LINKS_KV"
wrangler kv:namespace create "LINKS_KV" --preview
```

### Set Bot Token
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

### Deploy Worker
```bash
pnpm deploy
```

### Register Webhook
```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-worker.workers.dev/webhook"}'
```

### Check Webhook Status
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### View Worker Logs
```bash
wrangler tail
```

### Run Locally
```bash
pnpm dev
```

### Run Tests
```bash
pnpm test
```

## Environment Variables

**In `wrangler.jsonc`:**

```jsonc
"kv_namespaces": [
  {
    "binding": "LINKS_KV",
    "id": "YOUR_PRODUCTION_ID",
    "preview_id": "YOUR_PREVIEW_ID"
  }
],
"vars": {
  "WORKER_URL": "https://your-worker.workers.dev"
}
```

**Secrets (set via CLI):**
- `TELEGRAM_BOT_TOKEN` - Your bot token from @BotFather

## File Structure

```
akaytbot/
├── src/
│   └── index.ts              # Main bot implementation
├── test/
│   ├── index.spec.ts         # Tests
│   └── env.d.ts
├── public/
│   └── index.html
├── package.json
├── wrangler.jsonc            # Worker configuration
├── tsconfig.json
├── vitest.config.mts
├── README.md                 # Full documentation
├── SETUP.md                  # Detailed setup guide
├── TEST_CASES.md             # Test examples
└── QUICK_REFERENCE.md        # This file
```

## Error Messages & Solutions

| Error                          | Cause                           | Solution                                     |
| ------------------------------ | ------------------------------- | -------------------------------------------- |
| "Invalid URL provided"         | The target URL is malformed     | Use full URLs like `https://example.com`     |
| "Slug already exists"          | Trying to create duplicate slug | Use a different slug or delete the old one   |
| "Short URL not found"          | Slug doesn't exist              | Check slug name with `/check`                |
| "TELEGRAM_BOT_TOKEN undefined" | Secret not set                  | Run `wrangler secret put TELEGRAM_BOT_TOKEN` |
| "WORKER_URL undefined"         | Variable not set                | Add `WORKER_URL` to vars in wrangler.jsonc   |
| Bot not responding             | Webhook not registered          | Run the webhook registration command         |

## Useful Links

- [Telegram BotFather](https://t.me/botfather) - Create/manage bots
- [grammy Documentation](https://grammy.dev/) - Bot framework
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/) - Deployment platform
- [Cloudflare KV Docs](https://developers.cloudflare.com/workers/runtime-apis/kv/) - Storage
- [Telegram Bot API](https://core.telegram.org/bots/api) - API reference
