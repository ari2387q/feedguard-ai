import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
      const response = await fetch(`${process.env.ML_SERVICE_URL}/predict-toxic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Toxic check failed' });
  }
});

export default router;