import { Bot, webhookCallback } from 'grammy';
import { Context } from 'grammy';

interface Env {
	LINKS_KV: KVNamespace;
	TELEGRAM_BOT_TOKEN: string;
	WORKER_URL: string;
}

// Extended context type for better type safety
type BotContext = Context & { env: Env };

// Initialize bot
function createBot(env: Env): Bot<BotContext> {
	const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);

	// Middleware to attach env to context
	bot.use(async (ctx, next) => {
		ctx.env = env;
		await next();
	});

	// /start command
	bot.command('start', async (ctx) => {
		await ctx.reply(
			'Welcome to the Link Shortener Bot! 🔗\n\n' +
			'Available commands:\n' +
			'• `/create [slug] [url]` - Create a short URL\n' +
			'• `/delete [slug]` - Delete a short URL\n' +
			'• `/check [slug]` - Check information about a short URL',
			{ parse_mode: 'Markdown' }
		);
	});

	// /create command
	bot.command('create', async (ctx) => {
		const args = ctx.message?.text?.split(' ').slice(1) || [];

		if (args.length < 2) {
			await ctx.reply('Usage: `/create [slug] [url]`\n\nExample: `/create google https://google.com`', {
				parse_mode: 'Markdown',
			});
			return;
		}

		const [slug, targetUrl] = args;

		// Basic URL validation
		if (!isValidUrl(targetUrl)) {
			await ctx.reply('Invalid URL provided. Please provide a valid URL starting with http:// or https://', {
				parse_mode: 'Markdown',
			});
			return;
		}

		try {
			const existingUrl = await ctx.env.LINKS_KV.get(slug);

			if (existingUrl) {
				await ctx.reply(`Slug \`${slug}\` already exists, pointing to \`${existingUrl}\``, {
					parse_mode: 'Markdown',
				});
				return;
			}

			await ctx.env.LINKS_KV.put(slug, targetUrl);

			const shortUrl = `${ctx.env.WORKER_URL}/${slug}`;
			await ctx.reply(`✅ Short URL created!\n\nSlug: \`${slug}\`\nShort URL: \`${shortUrl}\`\nTarget: \`${targetUrl}\``, {
				parse_mode: 'Markdown',
			});
		} catch (error) {
			await ctx.reply('❌ Error creating short URL. Please try again.', { parse_mode: 'Markdown' });
			console.error('Error in /create:', error);
		}
	});

	// /delete command
	bot.command('delete', async (ctx) => {
		const args = ctx.message?.text?.split(' ').slice(1) || [];

		if (args.length < 1) {
			await ctx.reply('Usage: `/delete [slug]`\n\nExample: `/delete google`', {
				parse_mode: 'Markdown',
			});
			return;
		}

		const slug = args[0];

		try {
			const existingUrl = await ctx.env.LINKS_KV.get(slug);

			if (!existingUrl) {
				await ctx.reply(`Short URL \`${slug}\` not found.`, { parse_mode: 'Markdown' });
				return;
			}

			await ctx.env.LINKS_KV.delete(slug);
			await ctx.reply(`✅ Short URL \`${slug}\` has been deleted.`, { parse_mode: 'Markdown' });
		} catch (error) {
			await ctx.reply('❌ Error deleting short URL. Please try again.', { parse_mode: 'Markdown' });
			console.error('Error in /delete:', error);
		}
	});

	// /check command
	bot.command('check', async (ctx) => {
		const args = ctx.message?.text?.split(' ').slice(1) || [];

		if (args.length < 1) {
			await ctx.reply('Usage: `/check [slug]`\n\nExample: `/check google`', {
				parse_mode: 'Markdown',
			});
			return;
		}

		const slug = args[0];

		try {
			const targetUrl = await ctx.env.LINKS_KV.get(slug);

			if (!targetUrl) {
				await ctx.reply(`Short URL \`${slug}\` not found.`, { parse_mode: 'Markdown' });
				return;
			}

			const shortUrl = `${ctx.env.WORKER_URL}/${slug}`;
			await ctx.reply(
				`ℹ️ Information for \`${slug}\`:\n\n` +
				`Short URL: \`${shortUrl}\`\n` +
				`Target: \`${targetUrl}\``,
				{ parse_mode: 'Markdown' }
			);
		} catch (error) {
			await ctx.reply('❌ Error checking short URL. Please try again.', { parse_mode: 'Markdown' });
			console.error('Error in /check:', error);
		}
	});

	// Catch-all for unknown commands
	bot.on('message', async (ctx) => {
		await ctx.reply('Unknown command. Use /start to see available commands.', {
			parse_mode: 'Markdown',
		});
	});

	return bot;
}

// URL validation helper
function isValidUrl(url: string): boolean {
	try {
		const urlObj = new URL(url);
		return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
	} catch {
		return false;
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Handle Telegram Webhook
		if (request.method === 'POST' && url.pathname === '/webhook') {
			try {
				const bot = createBot(env);
				const handleUpdate = webhookCallback(bot, 'cloudflare');
				
				// For Cloudflare Workers, we need to handle the webhook callback differently
				const response = new Promise<Response>((resolve) => {
					handleUpdate({
						request: request as any,
						respondWith: (res: Promise<Response>) => {
							res.then(resolve);
						},
					});
				});
				
				return await response;
			} catch (error) {
				console.error('Webhook error:', error);
				return new Response(JSON.stringify({ ok: true }), { status: 200 });
			}
		}

		// Handle URL Redirection
		if (request.method === 'GET') {
			const slug = url.pathname.substring(1); // Remove leading slash

			if (slug && slug !== 'favicon.ico') {
				try {
					const targetUrl = await env.LINKS_KV.get(slug);

					if (targetUrl) {
						return Response.redirect(targetUrl, 302);
					} else {
						return new Response('Short URL not found', { status: 404 });
					}
				} catch (error) {
					console.error('Error retrieving redirect:', error);
					return new Response('Internal Server Error', { status: 500 });
				}
			}

			// Root path
			return new Response('Link Shortener Bot is running!', { status: 200 });
		}

		// Handle other methods
		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
