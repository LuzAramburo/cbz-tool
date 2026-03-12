import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'http';
import cbzRouter from './routes/cbz.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function start(port = 3000): Server {
  const app = express();
  app.use(express.json());

  app.use('/api/cbz', cbzRouter);

  if (process.env.NODE_ENV !== 'development') {
    const publicDir = join(__dirname, '..', 'public');
    app.use(express.static(publicDir));

    app.get('*', (req: Request, res: Response) => {
      res.sendFile(join(publicDir, 'index.html'));
    });
  }

  return app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
