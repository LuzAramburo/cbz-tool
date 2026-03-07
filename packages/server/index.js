import express from 'express';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function start(port = 3000) {
    const app = express();
    app.use(express.json());

    // API routes first
    app.get('/api/greet', (req, res) => {
        res.json({ message: 'Hello, world!' });
    });

    // Serve static files + SPA fallback in production
    if (process.env.NODE_ENV !== 'development') {
        app.use(express.static(join(__dirname, 'public')));

        // Any non-API route serves index.html (lets React Router handle it)
        app.get('*', (req, res) => {
            res.sendFile(join(__dirname, 'public', 'index.html'));
        });
    }

    return app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}