import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono();

app.post('/updateCanvas', async (c) => {
  try {
    const body = await c.req.json();
    const { canvasData } = body;

    // Mock canvas update - just return success
    console.log('Canvas update received:', canvasData ? 'data present' : 'no data');

    return c.json({
      success: true,
      saved: true,
      message: 'Canvas updated successfully (mock)'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Invalid request body'
    }, 400);
  }
});

export const POST = handle(app);
