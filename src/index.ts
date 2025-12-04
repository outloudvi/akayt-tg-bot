import { Bot, webhookCallback } from 'grammy';
import { Context } from 'grammy';
import { Storage } from './storage';

const EnvKeys = ['BACKEND_BASE_URL', 'TELEGRAM_BOT_TOKEN', 'BOT_SECRET_TOKEN', 'BACKEND_ADMIN_TOKEN', 'ALLOWED_USER_IDS'] as const;

type Env = Record<(typeof EnvKeys)[number], string>;

// Extended context type for better type safety
type BotContext = Context & { env: Env };

// Initialize bot
function createBot(env: Env): Bot<BotContext> {
	const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);
	const storage = new Storage(env.BACKEND_BASE_URL, env.BACKEND_ADMIN_TOKEN);

	// Middleware to attach env to context
	bot.use(async (ctx, next) => {
		ctx.env = env;
		await next();
	});

	// Middleware to check if user is allowed
	bot.use(async (ctx, next) => {
		// Only check for messages, not other updates
		if (!ctx.message) {
			await next();
			return;
		}

		// Parse the allowed user IDs
		const allowedIds = env.ALLOWED_USER_IDS.split(',')
			.map((id) => id.trim())
			.filter((id) => id.length > 0);

		// Check if user is allowed
		const userId = ctx.from?.id.toString();
		if (!userId || !allowedIds.includes(userId)) {
			console.warn(`Unauthorized access attempt from user ${userId}`);
			return;
		}

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
			{ parse_mode: 'Markdown' },
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
			const existingUrl = await storage.get(slug);

			if (existingUrl) {
				await ctx.reply(`Slug \`${slug}\` already exists, pointing to \`${existingUrl}\``, {
					parse_mode: 'Markdown',
				});
				return;
			}

			await storage.put(slug, targetUrl);

			const shortUrl = slug;
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
			const existingUrl = await storage.get(slug);

			if (!existingUrl) {
				await ctx.reply(`Short URL \`${slug}\` not found.`, { parse_mode: 'Markdown' });
				return;
			}

			await storage.delete(slug);
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
			const targetUrl = await storage.get(slug);

			if (!targetUrl) {
				await ctx.reply(`Short URL \`${slug}\` not found.`, { parse_mode: 'Markdown' });
				return;
			}

			const shortUrl = slug;
			await ctx.reply(
				`ℹ️ Information for \`${slug}\`:\n\n` + `Short URL: \`${shortUrl}\`\n` + `Target: \n${JSON.stringify(targetUrl, null, 2)}`,
				{
					parse_mode: 'Markdown',
				},
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
		for (const key of EnvKeys) {
			if (!env[key]) {
				return new Response(`Bad configurations: ${key} not found`, { status: 500 });
			}
		}

		const url = new URL(request.url);

		// Handle Telegram Webhook
		if (request.method === 'POST' && url.pathname === '/webhook') {
			try {
				const bot = createBot(env);
				const handleUpdate = webhookCallback(bot, 'cloudflare-mod', {
					secretToken: env.BOT_SECRET_TOKEN,
				});

				return handleUpdate(request);
			} catch (error) {
				console.error('Webhook error:', error);
				return new Response(JSON.stringify({ ok: true }), { status: 200 });
			}
		} // Handle other methods
		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
