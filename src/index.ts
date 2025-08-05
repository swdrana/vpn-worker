import { Hono } from 'hono';

// Define a type for your environment variables
type Env = {
	PANEL_URLS: string[];
};

const app = new Hono<{ Bindings: Env }>();

// Fallback HTML page
const FALLBACK_HTML = `
  <!DOCTYPE html>
  <html>
  <body>
    <h1>VPN Server is currently down.</h1>
    <p>Please try again later.</p>
  </body>
  </html>
`;

// Fallback JSON for API requests
const FALLBACK_API_RESPONSE = {
	status: 'error',
	message: 'All servers are currently unavailable.',
};

app.get('*', async (c) => {
	const PANEL_URLS = c.env.PANEL_URLS;
	const isApiRequest = c.req.path.startsWith('/api/');

	for (const url of PANEL_URLS) {
		try {
			const response = await fetch(url, { method: 'HEAD' });
			if (response.status === 200) {
				// Construct the full redirect URL
				const redirectUrl = new URL(c.req.url);
				redirectUrl.hostname = new URL(url).hostname;
				redirectUrl.port = new URL(url).port;
				return c.redirect(redirectUrl.toString(), 302);
			}
		} catch (e: unknown) {
			if (e instanceof Error) {
				console.error(`Failed to reach ${url}: ${e.message}`);
			}
		}
	}

	if (isApiRequest) {
		return c.json(FALLBACK_API_RESPONSE, 503);
	} else {
		return c.html(FALLBACK_HTML, 503);
	}
});

export default app;
