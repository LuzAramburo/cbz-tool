import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getBooks, uploadBooks, mergeBook, bulkDeleteBooks, getBookById, downloadBook, deleteBookById } from '../controllers/books.js';
import { getPage, getPageThumbnail, addPagesToBook, moveBookPage, deleteBookPage, deleteBookPages } from '../controllers/pages.js';
import { setMetadataKey, deleteMetadataKey, patchMetadata } from '../controllers/metadata.js';

const router = Router();
const MAX_FILE_SIZE_BYTES = parseInt(process.env['MAX_FILE_SIZE_MB'] ?? '100', 10) * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

router.get('/', getBooks);
router.post('/upload', upload.array('files'), uploadBooks);
router.post('/merge', mergeBook);
router.post('/delete', bulkDeleteBooks);
router.get('/:bookId', getBookById);
router.get('/:bookId/page/:index', getPage);
router.get('/:bookId/page/:index/thumbnail', getPageThumbnail);
router.post('/:bookId/pages', upload.array('files'), addPagesToBook);
router.patch('/:bookId/page/:index', moveBookPage);
router.delete('/:bookId/pages', deleteBookPages);
router.delete('/:bookId/page/:index', deleteBookPage);
router.get('/:bookId/download', downloadBook);
router.put('/:bookId/metadata/:key', setMetadataKey);
router.delete('/:bookId/metadata/:key', deleteMetadataKey);
router.patch('/:bookId/metadata', patchMetadata);
router.delete('/:bookId', deleteBookById);

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
      });
    } else {
      res.status(400).json({ error: err.message });
    }
    return;
  }
  console.error('Unexpected error in CBZ router:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default router;
