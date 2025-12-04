# Link Shortener Telegram Bot

A Telegram bot that runs on Cloudflare Workers using TypeScript. Create, delete, and check short URLs with simple commands.

## Features

- **`/create [slug] [url]`** - Create a short URL with a custom slug
- **`/delete [slug]`** - Delete a short URL
- **`/check [slug]`** - Get information about a short URL
- **`/start`** - Display help and available commands
- Automatic URL redirects via the Worker domain
- Built with [grammy](https://grammy.dev/) for robust Telegram API integration
- Stores links in Cloudflare KV storage
- Environment variables for sensitive secrets

## Prerequisites

- Node.js 18+ with pnpm
- A Cloudflare account with Workers enabled
- A Telegram bot token from [@BotFather](https://t.me/botfather)

## Setup Instructions

### 1. Create a Cloudflare KV Namespace

```bash
wrangler kv:namespace create "LINKS_KV"
wrangler kv:namespace create "LINKS_KV" --preview
```

This will output something like:
```
🌀 Creating namespace with title "LINKS_KV"
✅ Add the following to your wrangler.toml:
kv_namespaces = [ { binding = "LINKS_KV", id = "xxxxxxxxxxxxxxxxxxxxxx", preview_id = "yyyyyyyyyyyyyyyyyyyyyy" } ]
```

### 2. Update `wrangler.jsonc`

Replace the KV namespace IDs in the `kv_namespaces` section:

```jsonc
"kv_namespaces": [
	{
		"binding": "LINKS_KV",
		"id": "YOUR_KV_NAMESPACE_ID",      // From the output above
		"preview_id": "YOUR_PREVIEW_KV_NAMESPACE_ID"
	}
],
"vars": {
	"WORKER_URL": "https://your-worker-url.workers.dev"
}
```

### 3. Set the Telegram Bot Token Secret

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

When prompted, paste your Telegram bot token from [@BotFather](https://t.me/botfather).

### 4. Deploy the Worker

```bash
pnpm deploy
```

This will output your Worker URL. Update the `WORKER_URL` variable in `wrangler.jsonc` with this URL.

### 5. Register the Webhook with Telegram

After deployment, register your webhook:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-worker-url.workers.dev/webhook"}'
```

Or use this command with your actual bot token and worker URL:

```bash
wrangler secret get TELEGRAM_BOT_TOKEN | \
  xargs -I {} curl -X POST "https://api.telegram.org/bot{}/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://your-worker-url.workers.dev/webhook"}'
```

### 6. Test the Bot

Open Telegram and search for your bot. Send `/start` to see available commands.

## Usage Examples

### Create a Short URL
```
/create github https://github.com
```
Response:
```
✅ Short URL created!

Slug: `github`
Short URL: `https://your-worker-url.workers.dev/github`
Target: `https://github.com`
```

### Check a Short URL
```
/check github
```
Response:
```
ℹ️ Information for `github`:

Short URL: `https://your-worker-url.workers.dev/github`
Target: `https://github.com`
```

### Delete a Short URL
```
/delete github
```
Response:
```
✅ Short URL `github` has been deleted.
```

## Development

### Run Locally
```bash
pnpm dev
```

The worker will run at `http://localhost:8787`.

### Run Tests
```bash
pnpm test
```

## Architecture

- **Framework**: Cloudflare Workers
- **Language**: TypeScript
- **Telegram API**: [grammy](https://grammy.dev/)
- **Storage**: Cloudflare KV Store
- **Deployment**: Wrangler CLI

## Environment Variables

The bot uses the following environment configuration:

- `TELEGRAM_BOT_TOKEN` (secret) - Your Telegram bot token
- `WORKER_URL` (variable) - The public URL of your deployed Worker
- `LINKS_KV` (KV binding) - Storage for short URLs

## Security

- Bot token is stored as a secret and never exposed in code
- KV namespace provides isolated data storage
- Webhook-based updates instead of polling
- Input validation for URLs

## File Structure

```
akaytbot/
├── src/
│   └── index.ts              # Main bot logic with grammy
├── test/
│   ├── index.spec.ts         # Tests
│   └── env.d.ts
├── public/
│   └── index.html
├── package.json
├── wrangler.jsonc            # Cloudflare Worker configuration
├── tsconfig.json
├── vitest.config.mts
└── README.md
```

## Troubleshooting

### "Telegram Bot Token not found" error
Make sure you've set the secret:
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

### Webhook not receiving updates
1. Check webhook is registered: 
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```
2. Verify the webhook URL is correct and accessible
3. Check Worker logs for errors

### Short URLs not redirecting
1. Ensure WORKER_URL in wrangler.jsonc matches your actual Worker URL
2. Check KV namespace is properly bound
3. Verify the slug exists with `/check [slug]`

## License

MIT
