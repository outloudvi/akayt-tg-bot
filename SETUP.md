# Setup Guide - Link Shortener Telegram Bot

This guide walks you through the complete setup process for deploying the Link Shortener Bot to Cloudflare Workers.

## Step 1: Get a Telegram Bot Token

1. Open Telegram and search for `@BotFather`
2. Send `/start` and follow the prompts
3. Send `/newbot` and choose a name and username for your bot
4. Save the token you receive (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

## Step 2: Create Cloudflare KV Namespaces

KV (Key-Value) storage is where short URLs will be saved.

```bash
# Create production namespace
wrangler kv:namespace create "LINKS_KV"

# Create preview namespace (for local testing)
wrangler kv:namespace create "LINKS_KV" --preview
```

You'll see output like:
```
🌀 Creating namespace with title "LINKS_KV"
✅ Add the following to your wrangler.jsonc:
kv_namespaces = [ 
  { 
    binding = "LINKS_KV", 
    id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    preview_id = "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4" 
  } 
]
```

## Step 3: Update wrangler.jsonc

Open `wrangler.jsonc` and update the KV namespace IDs you just created:

```jsonc
"kv_namespaces": [
	{
		"binding": "LINKS_KV",
		"id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",      // Paste your ID here
		"preview_id": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4"  // Paste your preview ID here
	}
],
"vars": {
	"WORKER_URL": "https://your-worker-url.workers.dev"  // Update after first deployment
}
```

## Step 4: Set the Telegram Bot Token Secret

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

When prompted, paste your Telegram bot token (the one you got from @BotFather).

Verify it was set:
```bash
wrangler secret list
```

## Step 5: Deploy to Cloudflare

```bash
pnpm deploy
```

The output will show your Worker URL, something like:
```
✅ Uploaded super-tree-51b3 (1.23 sec)
👷 Added route https://super-tree-51b3.workers.dev/*
```

## Step 6: Update Worker URL and Redeploy

Update the `WORKER_URL` variable in `wrangler.jsonc` with your actual Worker URL:

```jsonc
"vars": {
	"WORKER_URL": "https://super-tree-51b3.workers.dev"  // Replace with your URL
}
```

Deploy again:
```bash
pnpm deploy
```

## Step 7: Register the Webhook with Telegram

This tells Telegram to send updates to your Worker.

Replace `YOUR_BOT_TOKEN` and `your-worker-url` with your actual values:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-worker-url.workers.dev/webhook"
  }'
```

Example with actual values:
```bash
curl -X POST https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://super-tree-51b3.workers.dev/webhook"
  }'
```

You should see a response like:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Verify Webhook Registration

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Look for `"ok": true` and your webhook URL in the response.

## Step 8: Test the Bot

1. Open Telegram
2. Search for your bot (the username you chose in Step 1)
3. Send `/start` to see the welcome message with available commands

Try the commands:
```
/create google https://google.com
/check google
/delete google
```

## Environment Variables Summary

| Variable             | Type       | Purpose                                                   |
| -------------------- | ---------- | --------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | Secret     | Authentication with Telegram API                          |
| `WORKER_URL`         | Variable   | The public URL of your Worker (for generating short URLs) |
| `LINKS_KV`           | KV Binding | Storage for short URL mappings                            |

## Development & Testing

### Run Locally

```bash
pnpm dev
```

Then test with:
```bash
# Create a short URL
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "chat": {"id": 12345, "type": "private"},
      "from": {"id": 12345, "is_bot": false, "first_name": "Test"},
      "date": 1234567890,
      "text": "/create test https://example.com"
    }
  }'
```

### Run Tests

```bash
pnpm test
```

## Troubleshooting

### Bot not responding to commands

1. **Check webhook registration:**
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```
   Should show your webhook URL and `ok: true`

2. **Check Worker logs:**
   ```bash
   wrangler tail
   ```

3. **Verify bot token is set:**
   ```bash
   wrangler secret list
   ```

### "LINKS_KV not defined" error

Make sure you've added the KV namespace to `wrangler.jsonc` and the binding name is exactly `LINKS_KV`.

### "WORKER_URL undefined" error

Make sure you've set the `WORKER_URL` variable in the `vars` section of `wrangler.jsonc`.

### Webhook returns error

1. Verify the webhook URL is correct and accessible
2. Check Worker logs with `wrangler tail`
3. Re-register the webhook:
   ```bash
   curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-url/webhook"}'
   ```

## Next Steps

- Customize bot responses
- Add user authentication
- Add analytics tracking
- Set up custom domain
- Add QR code generation for short URLs

## Support

For issues with:
- **Telegram Bot API**: [BotFather](https://t.me/botfather) or [Bot API docs](https://core.telegram.org/bots/api)
- **Cloudflare Workers**: [Cloudflare Docs](https://developers.cloudflare.com/workers/)
- **grammy library**: [grammy docs](https://grammy.dev/)
