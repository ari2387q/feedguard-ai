import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { text } = req.body;
        const response = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
        
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Spam check failed' });
    }
});

export default router;