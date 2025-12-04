# Troubleshooting Guide

## Common Issues and Solutions

### 1. Bot Not Responding to Messages

**Symptom**: You've sent commands to the bot but it doesn't reply.

**Causes & Solutions**:

#### A. Webhook Not Registered
```bash
# Check if webhook is registered
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

**Fix**: Register the webhook
```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-worker-url.workers.dev/webhook"}'
```

#### B. Incorrect Webhook URL
Make sure:
- URL is HTTPS (not HTTP)
- URL matches your deployed worker exactly
- `/webhook` path is included

**Fix**: Update webhook with correct URL
```bash
TOKEN="YOUR_BOT_TOKEN"
WORKER_URL="https://your-worker-url.workers.dev"
curl -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WORKER_URL}/webhook\"}"
```

#### C. Worker Not Deployed or Crashed
```bash
# Check worker is running
curl https://your-worker-url.workers.dev/

# View logs
wrangler tail
```

**Fix**: Deploy or fix errors
```bash
pnpm deploy
```

#### D. Bot Token Incorrect or Not Set
```bash
# Verify secret is set
wrangler secret list
```

Should show `TELEGRAM_BOT_TOKEN` in the list.

**Fix**: Set the token
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your token when prompted
```

---

### 2. "TELEGRAM_BOT_TOKEN is undefined"

**Symptom**: Error message or bot not authenticating.

**Cause**: Secret not properly set.

**Fix**:
```bash
# Remove old secret
wrangler secret delete TELEGRAM_BOT_TOKEN

# Set it again
wrangler secret put TELEGRAM_BOT_TOKEN

# Verify it's set
wrangler secret list
```

---

### 3. "LINKS_KV is not defined"

**Symptom**: Errors when trying to create/check/delete URLs.

**Cause**: KV namespace not configured or bound.

**Fix**:
1. Create KV namespace if not done:
```bash
wrangler kv:namespace create "LINKS_KV"
```

2. Update `wrangler.jsonc` with correct namespace ID:
```jsonc
"kv_namespaces": [
  {
    "binding": "LINKS_KV",
    "id": "YOUR_ACTUAL_NAMESPACE_ID",
    "preview_id": "YOUR_ACTUAL_PREVIEW_ID"
  }
]
```

3. Redeploy:
```bash
pnpm deploy
```

---

### 4. "WORKER_URL is undefined"

**Symptom**: Bot responds with error about undefined WORKER_URL.

**Cause**: Environment variable not set in wrangler.jsonc.

**Fix**:
1. Add to `wrangler.jsonc`:
```jsonc
"vars": {
  "WORKER_URL": "https://your-worker-url.workers.dev"
}
```

2. If you don't know your worker URL, deploy first:
```bash
pnpm deploy
```
The output will show your URL.

3. Update `WORKER_URL` with the correct URL

4. Redeploy:
```bash
pnpm deploy
```

---

### 5. Slug Already Exists Error (when creating new)

**Symptom**: Can't create a short URL because slug already exists.

**Solution**: Either:
- Use a different slug
- Delete the existing one first: `/delete [slug]`

**Check existing**:
```bash
# In Telegram with bot
/check existing-slug

# Or in terminal with wrangler
wrangler kv:key get existing-slug --binding=LINKS_KV
```

---

### 6. "Invalid URL provided" Error

**Symptom**: URL creation fails with invalid URL error.

**Cause**: Target URL doesn't start with http:// or https://

**Fix**: Use complete URLs:
```
❌ Wrong: /create google google.com
✅ Right: /create google https://google.com

❌ Wrong: /create github github.com/user
✅ Right: /create github https://github.com/user
```

---

### 7. Redirect Not Working

**Symptom**: Visiting `https://worker-url/slug` doesn't redirect.

**Causes & Solutions**:

#### A. Slug doesn't exist
```bash
# Check if slug exists
/check slug-name

# Or in terminal
wrangler kv:key get slug-name --binding=LINKS_KV
```

**Fix**: Create it
```
/create slug-name https://target-url.com
```

#### B. Wrong WORKER_URL
If you see the Worker's welcome page instead of redirect:

1. Verify your actual worker URL:
```bash
wrangler deployments list
```

2. Update `WORKER_URL` in `wrangler.jsonc`
3. Redeploy

#### C. Slug contains invalid characters
Short slugs should be simple: letters, numbers, hyphens, underscores

```
❌ /create my slug https://example.com  (spaces)
✅ /create my-slug https://example.com  (hyphens)

❌ /create my:slug https://example.com  (colons)
✅ /create my_slug https://example.com  (underscores)
```

---

### 8. 404 Errors from Webhook

**Symptom**: Webhook returns 404 or doesn't receive updates.

**Causes & Solutions**:

#### A. Webhook URL is wrong
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

Check that `url` field shows correct URL with `/webhook`

**Fix**: Re-register:
```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-worker.workers.dev/webhook"}'
```

#### B. Worker deployed to different URL
If you see a different URL in webhook info than your current worker:

1. Get current worker URL:
```bash
wrangler deployments list
```

2. Register correct webhook
3. Update `WORKER_URL` in wrangler.jsonc
4. Redeploy

---

### 9. Deployment Fails

**Symptom**: `pnpm deploy` gives errors.

**Solutions**:

#### A. TypeScript Errors
```bash
# Check for errors
pnpm test

# Or let TypeScript compiler check
npx tsc --noEmit
```

**Fix**: Review error messages and fix issues in `src/index.ts`

#### B. Authentication Issues
```bash
# Check if you're logged in
wrangler whoami
```

**Fix**: Login to Cloudflare
```bash
wrangler login
```

#### C. Wrangler Version Issues
```bash
# Update wrangler
pnpm update wrangler@latest
```

---

### 10. KV Namespace Limit Exceeded

**Symptom**: Can't add more short URLs, getting quota error.

**Solutions**:
- Cloudflare KV offers generous free tier
- Check current keys:
```bash
wrangler kv:key list --binding=LINKS_KV | wc -l
```

- Delete unused slugs:
```bash
/delete old-slug
```

- Contact Cloudflare support if hitting real limits

---

### 11. Slow Response Times

**Symptom**: Bot takes a long time to respond or redirects are slow.

**Solutions**:

#### A. Worker cold start (normal first request)
- First request may be slightly slower - this is normal

#### B. KV operation slow
- KV operations are usually very fast
- Check worker logs for errors:
```bash
wrangler tail
```

#### C. Network issues
- Try from different network/device
- Check Cloudflare status: https://www.cloudflarestatus.com/

---

### 12. "Cannot find module 'grammy'" Error

**Symptom**: TypeScript/build error about missing grammy.

**Cause**: Dependencies not installed.

**Fix**:
```bash
pnpm install

# Regenerate types
pnpm cf-typegen
```

---

### 13. Testing Issues

**Symptom**: Tests fail or won't run.

**Fix**:
```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Check for errors
pnpm test --reporter=verbose
```

---

### 14. Local Development Issues

**Symptom**: `pnpm dev` fails or doesn't respond.

**Fix**:
```bash
# Kill any existing processes
lsof -i :8787
kill -9 <PID>

# Clear cache
rm -rf .wrangler

# Run dev server
pnpm dev
```

---

### 15. Bot Token Exposed/Compromised

**Symptom**: You accidentally shared or exposed your bot token.

**Fix**:
1. Go to @BotFather on Telegram
2. Select your bot
3. Choose "API Token" → "Revoke current"
4. Get new token
5. Update secret:
```bash
wrangler secret delete TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN
# Paste new token
```

---

## Debugging Tips

### 1. Enable Debug Logs

Add to your code:
```typescript
bot.use(async (ctx, next) => {
  console.log('Update:', JSON.stringify(ctx.update, null, 2));
  await next();
});
```

View logs:
```bash
wrangler tail
```

### 2. Test Webhook Manually

```bash
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "chat": {"id": 123, "type": "private", "first_name": "Test"},
      "from": {"id": 123, "is_bot": false, "first_name": "Test"},
      "date": 1234567890,
      "text": "/start"
    }
  }'
```

### 3. Check KV Data

```bash
# List all keys
wrangler kv:key list --binding=LINKS_KV

# Get specific value
wrangler kv:key get slug-name --binding=LINKS_KV

# Check prefix
wrangler kv:key list --binding=LINKS_KV --prefix="test"
```

### 4. View Real-time Logs

```bash
wrangler tail --follow

# Filter by level
wrangler tail --status ok
wrangler tail --status error
```

### 5. Verify Telegram Connection

```bash
# Test bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Get updates (polling mode, only if webhook not set)
curl https://api.telegram.org/bot<TOKEN>/getUpdates
```

---

## Quick Checklist

If bot isn't working, run through these:

- [ ] Bot token set: `wrangler secret list` shows `TELEGRAM_BOT_TOKEN`
- [ ] Worker deployed: `wrangler deployments list` shows recent deployment
- [ ] Webhook registered: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- [ ] Webhook URL correct: Should be `https://your-worker.workers.dev/webhook`
- [ ] KV namespace bound: `wrangler kv:namespace list` shows LINKS_KV
- [ ] WORKER_URL set: Check `wrangler.jsonc` vars section
- [ ] No TypeScript errors: `pnpm test` passes
- [ ] Worker responding: `curl https://your-worker.workers.dev/` returns 200
- [ ] Logs show activity: `wrangler tail` shows recent requests

---

## Getting Help

If you're still stuck:

1. **Check the docs**:
   - `README.md` - Overview
   - `SETUP.md` - Setup instructions
   - `CONFIG_EXAMPLES.md` - Configuration help

2. **View logs**:
   ```bash
   wrangler tail --follow
   ```

3. **Test endpoint**:
   ```bash
   curl https://your-worker-url.workers.dev/
   ```

4. **Check webhook**:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```

5. **Reference documentation**:
   - [grammy docs](https://grammy.dev/)
   - [Cloudflare Workers](https://developers.cloudflare.com/workers/)
   - [Telegram Bot API](https://core.telegram.org/bots/api)
