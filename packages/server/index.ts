import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function start(port = 3000): Server {
  const app = express();
  app.use(express.json());

  app.get('/api/greet', (req: Request, res: Response) => {
    res.json({ message: 'Hello, world!' });
  });

  if (process.env.NODE_ENV !== 'development') {
    app.use(express.static(join(__dirname, 'public')));

    app.get('*', (req: Request, res: Response) => {
      res.sendFile(join(__dirname, 'public', 'index.html'));
    });
  }

  return app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
