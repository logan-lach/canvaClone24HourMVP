import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono();

app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    // Mock authentication - just return success
    console.log(`Login attempt: ${username}`);

    return c.json({
      success: true,
      token: 'dummy-token-' + Math.random().toString(36).substring(7),
      message: 'Login successful (mock)'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Invalid request body'
    }, 400);
  }
});

export const POST = handle(app);
