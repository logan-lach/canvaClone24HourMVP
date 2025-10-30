import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono();

app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    // Mock signup - just return success
    console.log(`Signup attempt: ${username}`);

    return c.json({
      success: true,
      userId: 'user-' + Math.random().toString(36).substring(7),
      message: 'Signup successful (mock)'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Invalid request body'
    }, 400);
  }
});

export const POST = handle(app);
