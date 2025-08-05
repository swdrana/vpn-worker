import { Hono } from 'hono';

// Define a type for your environment variables
type Env = {
    PANEL_URLS: string[];
};

const app = new Hono<{ Bindings: Env }>();

const FALLBACK_HTML = `
  <!DOCTYPE html>
  <html>
  <body>
    <h1>VPN Server is currently down.</h1>
    <p>Please try again later.</p>
  </body>
  </html>
`;

const FALLBACK_API_RESPONSE = {
  status: 'error',
  message: 'All servers are currently unavailable.'
};

app.get('*', async (c) => {
  const PANEL_URLS = c.env.PANEL_URLS;
  const isApiRequest = c.req.path.startsWith('/api/');
  
  for (const url of PANEL_URLS) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.status === 200 || response.status === 302) {
        // Redirect to the URL, preserving the original path and query
        const redirectUrl = new URL(url);
        redirectUrl.pathname = new URL(c.req.url).pathname;
        redirectUrl.search = new URL(c.req.url).search;
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