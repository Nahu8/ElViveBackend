import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { jwtAuth } from '../middleware/jwtAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const prisma = new PrismaClient();

const uploadDir = path.join(__dirname, '../../storage/app/public/uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mime = file.mimetype;
    const isIcon = req.originalUrl?.includes('upload-icon') || req.body?.category === 'icon';
    let subdir = 'images';
    if (mime.startsWith('video/')) subdir = 'videos';
    if (isIcon) subdir = 'icons';
    const dir = path.join(uploadDir, subdir);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `file-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({ storage });

router.use(jwtAuth);

router.get('/', async (req, res) => {
  const { type } = req.query;
  const where = type ? { type } : {};
  const list = await prisma.media.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return res.json(list);
});

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
  }

  const mime = req.file.mimetype;
  let mediaType = 'image';
  let subdir = 'images';
  if (mime.startsWith('video/')) {
    mediaType = 'video';
    subdir = 'videos';
  }
  if (req.body?.category === 'icon') {
    mediaType = 'icon';
    subdir = 'icons';
  }

  const relPath = `/uploads/${subdir}/${req.file.filename}`;

  const media = await prisma.media.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: '/storage' + relPath,
      type: mediaType,
      size: req.file.size,
    },
  });

  return res.status(201).json({
    id: media.id,
    filename: media.filename,
    originalName: media.originalName,
    path: media.path,
    url: media.path,
    type: media.type,
    size: media.size,
  });
});

router.post('/upload-icon', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
  }
  const relPath = `/uploads/icons/${req.file.filename}`;
  const media = await prisma.media.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: '/storage' + relPath,
      type: 'icon',
      size: req.file.size,
    },
  });
  return res.status(201).json({
    id: media.id,
    filename: media.filename,
    originalName: media.originalName,
    path: media.path,
    url: media.path,
    type: media.type,
    size: media.size,
  });
});

router.delete('/:id', async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!media) return res.status(404).json({ error: 'Archivo no encontrado' });

  const fullPath = path.join(__dirname, '../../storage/app/public', media.path.replace('/storage/', ''));
  if (existsSync(fullPath)) {
    unlinkSync(fullPath);
  }

  await prisma.media.delete({ where: { id: media.id } });
  return res.json({ message: 'Archivo eliminado exitosamente' });
});

export { router as adminMediaRoutes };
