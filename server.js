import express from 'express';
const app = express();
app.use(express.static('public'));
app.use(express.json({ limit: '10kb' }));

// Health check: GET /api/health -> { "ok": true }
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Open http://localhost:${port}`));