import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { jwtAuth } from '../middleware/jwtAuth.js';
import { enrichMinistryWithMediaAsync } from '../utils/ministry-enrich.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const prisma = new PrismaClient();

const memoryUpload = multer({ storage: multer.memoryStorage() });

const uploadDir = path.join(__dirname, '../../storage/app/public/uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const mediaStorage = multer.diskStorage({
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

const mediaUpload = multer({ storage: mediaStorage });

// Helper: send binary response
function sendBinary(res, data, mime, name) {
  if (!data || (Buffer.isBuffer(data) && data.length === 0)) {
    return res.status(404).json({ error: 'No hay recurso' });
  }
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  res.set('Content-Type', mime || 'application/octet-stream');
  if (name) res.set('Content-Disposition', `inline; filename="${name}"`);
  res.set('Cache-Control', 'public, max-age=86400');
  return res.send(buf);
}

// ========== HOME ==========
router.get('/home', jwtAuth, async (req, res) => {
  let home = await prisma.home.findFirst();
  if (!home) {
    home = await prisma.home.create({
      data: {
        heroTitle: 'ÉL VIVE IGLESIA',
        heroButton1Text: 'VER EVENTOS',
        heroButton1Link: '/dias-reunion',
        heroButton2Text: 'CONOCE MÁS',
        heroButton2Link: '/contacto',
      },
    });
  }

  const hasVideo1 = await prisma.home.findFirst({
    where: { id: home.id, heroVideoData: { not: null } },
  });
  const hasVideo2 = await prisma.home.findFirst({
    where: { id: home.id, heroVideo2Data: { not: null } },
  });
  const hasIconDom = await prisma.home.findFirst({
    where: { id: home.id, heroIconDomData: { not: null } },
  });
  const hasIconMier = await prisma.home.findFirst({
    where: { id: home.id, heroIconMierData: { not: null } },
  });

  const cardImages = await prisma.meetingCardImage.findMany({
    select: { cardIndex: true, imageName: true },
  });
  const cardImagesMap = Object.fromEntries(cardImages.map((c) => [c.cardIndex, { imageName: c.imageName }]));

  return res.json({
    id: home.id,
    heroTitle: home.heroTitle,
    heroButton1Text: home.heroButton1Text,
    heroButton1Link: home.heroButton1Link,
    heroButton2Text: home.heroButton2Text,
    heroButton2Link: home.heroButton2Link,
    heroVideoUrl: home.heroVideoUrl ?? '',
    hasVideoDomingo: !!hasVideo1,
    heroVideoDomingoName: home.heroVideoName ?? '',
    hasVideoMiercoles: !!hasVideo2,
    heroVideoMiercolesName: home.heroVideo2Name ?? '',
    hasIconDomingo: !!hasIconDom,
    heroIconDomingoName: home.heroIconDomName ?? '',
    hasIconMiercoles: !!hasIconMier,
    heroIconMiercolesName: home.heroIconMierName ?? '',
    video1Url: home.video1Url ?? '',
    video2Url: home.video2Url ?? '',
    celebrations: home.celebrations ?? [],
    meetingDaysSummary: home.meetingDaysSummary,
    ministriesSummary: home.ministriesSummary,
    cardImages: cardImagesMap,
    createdAt: home.createdAt,
    updatedAt: home.updatedAt,
  });
});

router.put('/home', jwtAuth, async (req, res) => {
  const data = { ...req.body };
  delete data.heroVideoData;
  delete data.heroVideo2Data;

  let home = await prisma.home.findFirst();
  if (!home) {
    home = await prisma.home.create({ data });
    return res.status(201).json({ message: 'Home creado' });
  }
  await prisma.home.update({ where: { id: home.id }, data });
  return res.json({ message: 'Home actualizado' });
});

router.patch('/home/hero', jwtAuth, async (req, res) => {
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });

  const data = {
    heroTitle: req.body.heroTitle ?? home.heroTitle,
    heroButton1Text: req.body.heroButton1Text ?? home.heroButton1Text,
    heroButton1Link: req.body.heroButton1Link ?? home.heroButton1Link,
    heroButton2Text: req.body.heroButton2Text ?? home.heroButton2Text,
    heroButton2Link: req.body.heroButton2Link ?? home.heroButton2Link,
  };
  await prisma.home.update({ where: { id: home.id }, data });
  return res.json({ message: 'Hero actualizado' });
});

// Home videos & icons
router.post('/home/video', jwtAuth, memoryUpload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo de video' });
  if (!req.file.mimetype.startsWith('video/')) {
    return res.status(400).json({ error: 'El archivo debe ser un video' });
  }
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });
  await prisma.home.update({
    where: { id: home.id },
    data: {
      heroVideoData: req.file.buffer,
      heroVideoMime: req.file.mimetype,
      heroVideoName: req.file.originalname,
    },
  });
  return res.json({ message: 'Video Domingos guardado', heroVideoName: req.file.originalname });
});

router.get('/home/video', jwtAuth, async (req, res) => {
  const home = await prisma.home.findFirst({ where: { heroVideoData: { not: null } } });
  if (!home || !home.heroVideoData) return res.status(404).json({ error: 'No hay video guardado' });
  res.set('Content-Type', home.heroVideoMime ?? 'video/mp4');
  res.set('Content-Disposition', `inline; filename="${home.heroVideoName ?? 'video.mp4'}"`);
  res.set('Accept-Ranges', 'bytes');
  res.set('Cache-Control', 'public, max-age=86400');
  return res.send(Buffer.from(home.heroVideoData));
});

router.delete('/home/video', jwtAuth, async (req, res) => {
  const home = await prisma.home.findFirst();
  if (!home) return res.status(404).json({ error: 'No encontrado' });
  await prisma.home.update({
    where: { id: home.id },
    data: { heroVideoData: null, heroVideoMime: null, heroVideoName: null },
  });
  return res.json({ message: 'Video eliminado' });
});

router.post('/home/video2', jwtAuth, memoryUpload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo de video' });
  if (!req.file.mimetype.startsWith('video/')) {
    return res.status(400).json({ error: 'El archivo debe ser un video' });
  }
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });
  await prisma.home.update({
    where: { id: home.id },
    data: {
      heroVideo2Data: req.file.buffer,
      heroVideo2Mime: req.file.mimetype,
      heroVideo2Name: req.file.originalname,
    },
  });
  return res.json({ message: 'Video Miércoles guardado', heroVideoName: req.file.originalname });
});

router.get('/home/video2', jwtAuth, async (req, res) => {
  const home = await prisma.home.findFirst({ where: { heroVideo2Data: { not: null } } });
  if (!home || !home.heroVideo2Data) return res.status(404).json({ error: 'No hay video guardado' });
  res.set('Content-Type', home.heroVideo2Mime ?? 'video/mp4');
  res.set('Content-Disposition', `inline; filename="${home.heroVideo2Name ?? 'video.mp4'}"`);
  res.set('Accept-Ranges', 'bytes');
  res.set('Cache-Control', 'public, max-age=86400');
  return res.send(Buffer.from(home.heroVideo2Data));
});

function getArgentinaDayOfWeek() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  return d.getDay(); // 0=Sun ... 6=Sat. Mon=1, Tue=2, Wed=3
}

router.get('/home/current-video', async (req, res) => {
  const home = await prisma.home.findFirst();
  if (!home) return res.status(404).json({ error: 'No hay video' });

  const day = getArgentinaDayOfWeek();
  // Mon(1), Tue(2), Wed(3) → Miércoles video
  if (day <= 3 && day >= 1 && home.heroVideo2Data) {
    res.set('Content-Type', home.heroVideo2Mime ?? 'video/mp4');
    res.set('Content-Disposition', 'inline');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(home.heroVideo2Data));
  }
  if (home.heroVideoData) {
    res.set('Content-Type', home.heroVideoMime ?? 'video/mp4');
    res.set('Content-Disposition', 'inline');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(home.heroVideoData));
  }
  return res.status(404).json({ error: 'No hay video para hoy' });
});

router.post('/home/icon-dom', jwtAuth, memoryUpload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });
  await prisma.home.update({
    where: { id: home.id },
    data: {
      heroIconDomData: req.file.buffer,
      heroIconDomMime: req.file.mimetype,
      heroIconDomName: req.file.originalname,
    },
  });
  return res.json({ message: 'Ícono Domingos guardado', iconName: req.file.originalname });
});

router.get('/home/icon-dom', jwtAuth, async (req, res) => {
  const home = await prisma.home.findFirst({ where: { heroIconDomData: { not: null } } });
  if (!home || !home.heroIconDomData) return res.status(404).json({ error: 'No hay ícono' });
  return sendBinary(res, home.heroIconDomData, home.heroIconDomMime ?? 'image/png');
});

router.delete('/home/icon-dom', jwtAuth, async (req, res) => {
  const home = await prisma.home.findFirst();
  if (!home) return res.status(404).json({ error: 'No encontrado' });
  await prisma.home.update({
    where: { id: home.id },
    data: { heroIconDomData: null, heroIconDomMime: null, heroIconDomName: null },
  });
  return res.json({ message: 'Ícono eliminado' });
});

router.post('/home/icon-mier', jwtAuth, memoryUpload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });
  await prisma.home.update({
    where: { id: home.id },
    data: {
      heroIconMierData: req.file.buffer,
      heroIconMierMime: req.file.mimetype,
      heroIconMierName: req.file.originalname,
    },
  });
  return res.json({ message: 'Ícono Miércoles guardado', iconName: req.file.originalname });
});

router.get('/home/icon-mier', jwtAuth, async (req, res) => {
  const home = await prisma.home.findFirst({ where: { heroIconMierData: { not: null } } });
  if (!home || !home.heroIconMierData) return res.status(404).json({ error: 'No hay ícono' });
  return sendBinary(res, home.heroIconMierData, home.heroIconMierMime ?? 'image/png');
});

router.delete('/home/icon-mier', jwtAuth, async (req, res) => {
  const home = await prisma.home.findFirst();
  if (!home) return res.status(404).json({ error: 'No encontrado' });
  await prisma.home.update({
    where: { id: home.id },
    data: { heroIconMierData: null, heroIconMierMime: null, heroIconMierName: null },
  });
  return res.json({ message: 'Ícono eliminado' });
});

router.get('/home/current-icon', async (req, res) => {
  const home = await prisma.home.findFirst();
  if (!home) return res.status(404).json({ error: 'No hay ícono' });

  const day = getArgentinaDayOfWeek();
  if (day <= 3 && day >= 1 && home.heroIconMierData) {
    return sendBinary(res, home.heroIconMierData, home.heroIconMierMime ?? 'image/png');
  }
  if (home.heroIconDomData) {
    return sendBinary(res, home.heroIconDomData, home.heroIconDomMime ?? 'image/png');
  }
  return res.status(404).json({ error: 'No hay ícono para hoy' });
});

router.post('/home/card-image/:index', jwtAuth, memoryUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }
  const index = parseInt(req.params.index, 10);
  const card = await prisma.meetingCardImage.upsert({
    where: { cardIndex: index },
    create: {
      cardIndex: index,
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
    update: {
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
  });
  return res.json({
    message: 'Imagen de card guardada',
    imageName: card.imageName,
    imageUrl: `/api/home/card-image/${index}`,
  });
});

router.get('/home/card-image/:index', async (req, res) => {
  const index = parseInt(req.params.index, 10);
  const card = await prisma.meetingCardImage.findUnique({ where: { cardIndex: index } });
  if (!card || !card.imageData) return res.status(404).json({ error: 'No hay imagen' });
  return sendBinary(res, card.imageData, card.imageMime ?? 'image/jpeg');
});

router.delete('/home/card-image/:index', jwtAuth, async (req, res) => {
  const index = parseInt(req.params.index, 10);
  await prisma.meetingCardImage.deleteMany({ where: { cardIndex: index } });
  return res.json({ message: 'Imagen eliminada' });
});

router.patch('/home/celebrations', jwtAuth, async (req, res) => {
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });
  await prisma.home.update({
    where: { id: home.id },
    data: { celebrations: req.body.celebrations ?? [] },
  });
  return res.json({ message: 'Celebraciones actualizadas' });
});

router.patch('/home/meeting-days-summary', jwtAuth, async (req, res) => {
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });
  await prisma.home.update({
    where: { id: home.id },
    data: { meetingDaysSummary: req.body.meetingDaysSummary ?? home.meetingDaysSummary },
  });
  return res.json({ message: 'Resumen de días de reunión actualizado' });
});

router.patch('/home/ministries-summary', jwtAuth, async (req, res) => {
  let home = await prisma.home.findFirst();
  if (!home) home = await prisma.home.create({ data: {} });
  await prisma.home.update({
    where: { id: home.id },
    data: { ministriesSummary: req.body.ministriesSummary ?? home.ministriesSummary },
  });
  return res.json({ message: 'Resumen de ministerios actualizado' });
});

// ========== MEETING DAYS ==========
router.get('/meeting-days', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });

  const hasHeroImage = await prisma.meetingDays.findFirst({
    where: { id: md.id, heroImageData: { not: null } },
  });

  const upcomingEventsIcon = await prisma.sectionIcon.findFirst({
    where: { pageKey: 'meeting-days', sectionKey: 'upcoming-events', imageData: { not: null } },
  });
  const calendarIcon = await prisma.sectionIcon.findFirst({
    where: { pageKey: 'meeting-days', sectionKey: 'calendar', imageData: { not: null } },
  });

  const cal = md.calendarEvents ?? {};
  const upc = md.upcomingEvents ?? {};

  return res.json({
    id: md.id,
    sectionTitle: cal.sectionTitle ?? 'CALENDARIO DE EVENTOS',
    sectionSubtitle: cal.sectionSubtitle ?? '',
    hero: Object.keys(md.hero || {}).length ? md.hero : null,
    hasHeroImage: !!hasHeroImage,
    heroImageName: md.heroImageName ?? '',
    heroImageUrl: hasHeroImage ? '/api/meeting-days/hero-image' : null,
    calendarEvents: cal,
    upcomingEvents: Object.keys(upc).length ? upc : null,
    upcomingEventsIconUrl: upcomingEventsIcon ? '/api/section-icon/meeting-days/upcoming-events' : null,
    calendarIconUrl: calendarIcon ? '/api/section-icon/meeting-days/calendar' : null,
    eventCta: md.eventCta,
    eventSettings: md.eventSettings ?? {
      showPastEvents: true,
      showEventCountdown: true,
      defaultEventColor: '#3b82f6',
      defaultEventDuration: '120',
      enableEventRegistration: true,
      emailNotifications: true,
      reminderDaysBefore: '1',
    },
    createdAt: md.createdAt,
    updatedAt: md.updatedAt,
  });
});

router.put('/meeting-days', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) {
    md = await prisma.meetingDays.create({ data: req.body });
    return res.status(201).json(md);
  }
  const { heroImageData, heroImageMime, heroImageName, ...data } = req.body;
  await prisma.meetingDays.update({ where: { id: md.id }, data });
  return res.json(await prisma.meetingDays.findUnique({ where: { id: md.id } }));
});

router.patch('/meeting-days/hero', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });
  await prisma.meetingDays.update({
    where: { id: md.id },
    data: { hero: req.body.hero },
  });
  return res.json({ success: true, hero: (await prisma.meetingDays.findUnique({ where: { id: md.id } })).hero });
});

router.patch('/meeting-days/calendar-events', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });
  const data = req.body.calendarEvents ?? req.body;
  await prisma.meetingDays.update({ where: { id: md.id }, data: { calendarEvents: data } });
  return res.json({ success: true, calendarEvents: (await prisma.meetingDays.findUnique({ where: { id: md.id } })).calendarEvents });
});

router.patch('/meeting-days/upcoming-events', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });
  const data = req.body.upcomingEvents ?? req.body;
  await prisma.meetingDays.update({ where: { id: md.id }, data: { upcomingEvents: data } });
  return res.json({ success: true, upcomingEvents: (await prisma.meetingDays.findUnique({ where: { id: md.id } })).upcomingEvents });
});

router.patch('/meeting-days/event-cta', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });
  await prisma.meetingDays.update({
    where: { id: md.id },
    data: { eventCta: req.body.eventCta },
  });
  return res.json({ success: true, eventCta: (await prisma.meetingDays.findUnique({ where: { id: md.id } })).eventCta });
});

router.patch('/meeting-days/recurring-meetings', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });
  await prisma.meetingDays.update({
    where: { id: md.id },
    data: { recurringMeetings: req.body.recurringMeetings ?? md.recurringMeetings },
  });
  return res.json(await prisma.meetingDays.findUnique({ where: { id: md.id } }));
});

router.patch('/meeting-days/event-settings', jwtAuth, async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });
  await prisma.meetingDays.update({
    where: { id: md.id },
    data: { eventSettings: req.body.eventSettings ?? md.eventSettings },
  });
  return res.json({ message: 'Event settings actualizados' });
});

router.post('/meeting-days/hero-image', jwtAuth, memoryUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });
  await prisma.meetingDays.update({
    where: { id: md.id },
    data: {
      heroImageData: req.file.buffer,
      heroImageMime: req.file.mimetype,
      heroImageName: req.file.originalname,
    },
  });
  return res.json({
    message: 'Imagen guardada en la base de datos',
    heroImageName: req.file.originalname,
    heroImageUrl: '/api/meeting-days/hero-image',
  });
});

router.get('/meeting-days/hero-image', async (req, res) => {
  const md = await prisma.meetingDays.findFirst({ where: { heroImageData: { not: null } } });
  if (!md || !md.heroImageData) return res.status(404).json({ error: 'No hay imagen guardada' });
  return sendBinary(res, md.heroImageData, md.heroImageMime ?? 'image/jpeg', md.heroImageName ?? 'hero.jpg');
});

router.delete('/meeting-days/hero-image', jwtAuth, async (req, res) => {
  const md = await prisma.meetingDays.findFirst();
  if (!md) return res.status(404).json({ error: 'No encontrado' });
  await prisma.meetingDays.update({
    where: { id: md.id },
    data: { heroImageData: null, heroImageMime: null, heroImageName: null },
  });
  return res.json({ message: 'Imagen eliminada' });
});

// ========== EVENT MEDIA ==========
async function eventMediaUpload(type, req, res) {
  const eventId = String(req.params.eventId);
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }

  await prisma.eventMedia.deleteMany({ where: { eventId, mediaType: type } });
  await prisma.eventMedia.create({
    data: {
      eventId,
      mediaType: type,
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
  });

  const urlKey = type === 'icon' ? 'iconUrl' : 'backgroundUrl';
  return res.json({
    message: type === 'icon' ? 'Ícono guardado' : 'Imagen de fondo guardada',
    [urlKey]: `/api/event/${eventId}/${type}`,
    imageName: req.file.originalname,
  });
}

router.post('/event/:eventId/icon', jwtAuth, memoryUpload.single('icon'), (req, res) =>
  eventMediaUpload('icon', req, res)
);
router.get('/event/:eventId/icon', async (req, res) => {
  const media = await prisma.eventMedia.findFirst({
    where: { eventId: String(req.params.eventId), mediaType: 'icon' },
  });
  if (!media || !media.imageData) return res.status(404).json({ error: 'No hay ícono' });
  return sendBinary(res, media.imageData, media.imageMime ?? 'image/png');
});
router.delete('/event/:eventId/icon', jwtAuth, async (req, res) => {
  await prisma.eventMedia.deleteMany({
    where: { eventId: String(req.params.eventId), mediaType: 'icon' },
  });
  return res.json({ message: 'Ícono eliminado' });
});

router.post('/event/:eventId/background', jwtAuth, memoryUpload.single('image'), (req, res) =>
  eventMediaUpload('background', req, res)
);
router.get('/event/:eventId/background', async (req, res) => {
  const media = await prisma.eventMedia.findFirst({
    where: { eventId: String(req.params.eventId), mediaType: 'background' },
  });
  if (!media || !media.imageData) return res.status(404).json({ error: 'No hay imagen de fondo' });
  return sendBinary(res, media.imageData, media.imageMime ?? 'image/jpeg');
});
router.delete('/event/:eventId/background', jwtAuth, async (req, res) => {
  await prisma.eventMedia.deleteMany({
    where: { eventId: String(req.params.eventId), mediaType: 'background' },
  });
  return res.json({ message: 'Imagen de fondo eliminada' });
});

// ========== SECTION ICONS ==========
router.post('/section-icon/:pageKey/:sectionKey', jwtAuth, memoryUpload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }
  const { pageKey, sectionKey } = req.params;
  await prisma.sectionIcon.upsert({
    where: { pageKey_sectionKey: { pageKey, sectionKey } },
    create: {
      pageKey,
      sectionKey,
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
    update: {
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
  });
  return res.json({
    message: 'Ícono guardado',
    iconUrl: `/api/section-icon/${pageKey}/${sectionKey}`,
  });
});

router.get('/section-icon/:pageKey/:sectionKey', async (req, res) => {
  const { pageKey, sectionKey } = req.params;
  const icon = await prisma.sectionIcon.findUnique({
    where: { pageKey_sectionKey: { pageKey, sectionKey } },
  });
  if (!icon || !icon.imageData) return res.status(404).json({ error: 'No hay ícono' });
  return sendBinary(res, icon.imageData, icon.imageMime ?? 'image/png');
});

router.delete('/section-icon/:pageKey/:sectionKey', jwtAuth, async (req, res) => {
  const { pageKey, sectionKey } = req.params;
  await prisma.sectionIcon.deleteMany({ where: { pageKey, sectionKey } });
  return res.json({ message: 'Ícono eliminado' });
});

// ========== MINISTRIES CONTENT ==========
router.get('/ministries-content', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });

  const pageContent = m.pageContent ?? {};
  const sectionIcon = await prisma.sectionIcon.findFirst({
    where: { pageKey: 'ministries', sectionKey: 'section', imageData: { not: null } },
  });
  const processIcon = await prisma.sectionIcon.findFirst({
    where: { pageKey: 'ministries', sectionKey: 'process', imageData: { not: null } },
  });
  const testimonialsIcon = await prisma.sectionIcon.findFirst({
    where: { pageKey: 'ministries', sectionKey: 'testimonials', imageData: { not: null } },
  });
  const faqIcon = await prisma.sectionIcon.findFirst({
    where: { pageKey: 'ministries', sectionKey: 'faq', imageData: { not: null } },
  });

  pageContent.sectionIconUrl = sectionIcon ? '/api/section-icon/ministries/section' : null;
  pageContent.processIconUrl = processIcon ? '/api/section-icon/ministries/process' : null;
  pageContent.testimonialsIconUrl = testimonialsIcon ? '/api/section-icon/ministries/testimonials' : null;
  pageContent.faqIconUrl = faqIcon ? '/api/section-icon/ministries/faq' : null;

  return res.json({
    id: m.id,
    hero: m.hero,
    ministries: m.ministries ?? [],
    process: m.process,
    testimonials: m.testimonials ?? [],
    faqs: m.faqs ?? [],
    pageContent,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  });
});

router.put('/ministries-content', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) {
    m = await prisma.ministriesContent.create({ data: req.body });
    return res.status(201).json(m);
  }
  await prisma.ministriesContent.update({ where: { id: m.id }, data: req.body });
  return res.json(await prisma.ministriesContent.findUnique({ where: { id: m.id } }));
});

router.patch('/ministries-content/hero', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });
  await prisma.ministriesContent.update({
    where: { id: m.id },
    data: { hero: req.body.hero ?? m.hero },
  });
  return res.json(await prisma.ministriesContent.findUnique({ where: { id: m.id } }));
});

router.patch('/ministries-content/ministries', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });
  await prisma.ministriesContent.update({
    where: { id: m.id },
    data: { ministries: req.body.ministries ?? [] },
  });
  return res.json(await prisma.ministriesContent.findUnique({ where: { id: m.id } }));
});

router.patch('/ministries-content/process', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });
  await prisma.ministriesContent.update({
    where: { id: m.id },
    data: { process: req.body.process ?? m.process },
  });
  return res.json(await prisma.ministriesContent.findUnique({ where: { id: m.id } }));
});

router.patch('/ministries-content/testimonials', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });
  await prisma.ministriesContent.update({
    where: { id: m.id },
    data: { testimonials: req.body.testimonials ?? [] },
  });
  return res.json(await prisma.ministriesContent.findUnique({ where: { id: m.id } }));
});

router.patch('/ministries-content/faqs', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });
  await prisma.ministriesContent.update({
    where: { id: m.id },
    data: { faqs: req.body.faqs ?? [] },
  });
  return res.json(await prisma.ministriesContent.findUnique({ where: { id: m.id } }));
});

router.patch('/ministries-content/page-content', jwtAuth, async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });
  await prisma.ministriesContent.update({
    where: { id: m.id },
    data: { pageContent: req.body.pageContent ?? m.pageContent },
  });
  return res.json(await prisma.ministriesContent.findUnique({ where: { id: m.id } }));
});

// ========== MINISTRY MEDIA ==========
router.get('/ministry/:ministryId/media', jwtAuth, async (req, res) => {
  const ministryId = String(req.params.ministryId);

  const icon = await prisma.ministryMedia.findFirst({
    where: { ministryId, mediaType: 'icon' },
    select: { id: true, imageName: true },
  });
  const photos = await prisma.ministryMedia.findMany({
    where: { ministryId, mediaType: 'photo' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, imageName: true, sortOrder: true },
  });
  const videos = await prisma.ministryVideo.findMany({
    where: { ministryId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, videoName: true, sortOrder: true },
  });
  const hasCardImage = await prisma.ministryCardImage.findFirst({
    where: { ministryId },
  });

  return res.json({
    hasIcon: !!icon,
    hasCardImage: !!hasCardImage,
    cardImageUrl: hasCardImage ? `/api/ministry/${ministryId}/card-image` : null,
    iconName: icon?.imageName,
    iconUrl: icon ? `/api/ministry/${ministryId}/icon` : null,
    photos: photos.map((p) => ({
      id: p.id,
      name: p.imageName,
      url: `/api/ministry/${ministryId}/photo/${p.id}`,
    })),
    videos: videos.map((v) => ({
      id: v.id,
      name: v.videoName,
      url: `/api/ministry/${ministryId}/video/${v.id}`,
    })),
  });
});

router.post('/ministry/:ministryId/icon', jwtAuth, memoryUpload.single('icon'), async (req, res) => {
  const ministryId = String(req.params.ministryId);
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }

  await prisma.ministryMedia.deleteMany({ where: { ministryId, mediaType: 'icon' } });
  const media = await prisma.ministryMedia.create({
    data: {
      ministryId,
      mediaType: 'icon',
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
  });
  return res.json({
    message: 'Ícono guardado',
    iconUrl: `/api/ministry/${ministryId}/icon`,
    imageName: media.imageName,
  });
});

router.get('/ministry/:ministryId/icon', async (req, res) => {
  const media = await prisma.ministryMedia.findFirst({
    where: { ministryId: String(req.params.ministryId), mediaType: 'icon' },
  });
  if (!media || !media.imageData) return res.status(404).json({ error: 'No hay ícono' });
  return sendBinary(res, media.imageData, media.imageMime ?? 'image/png');
});

router.delete('/ministry/:ministryId/icon', jwtAuth, async (req, res) => {
  await prisma.ministryMedia.deleteMany({
    where: { ministryId: String(req.params.ministryId), mediaType: 'icon' },
  });
  return res.json({ message: 'Ícono eliminado' });
});

router.post('/ministry/:ministryId/photo', jwtAuth, memoryUpload.single('photo'), async (req, res) => {
  const ministryId = String(req.params.ministryId);
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }

  const maxSort = await prisma.ministryMedia.aggregate({
    where: { ministryId, mediaType: 'photo' },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const media = await prisma.ministryMedia.create({
    data: {
      ministryId,
      mediaType: 'photo',
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
      sortOrder,
    },
  });
  return res.json({
    message: 'Foto guardada',
    photoId: media.id,
    photoUrl: `/api/ministry/${ministryId}/photo/${media.id}`,
    imageName: media.imageName,
  });
});

router.get('/ministry/:ministryId/photo/:photoId', async (req, res) => {
  const media = await prisma.ministryMedia.findFirst({
    where: {
      id: parseInt(req.params.photoId),
      ministryId: String(req.params.ministryId),
      mediaType: 'photo',
    },
  });
  if (!media || !media.imageData) return res.status(404).json({ error: 'No hay foto' });
  return sendBinary(res, media.imageData, media.imageMime ?? 'image/jpeg');
});

router.delete('/ministry/:ministryId/photo/:photoId', jwtAuth, async (req, res) => {
  await prisma.ministryMedia.deleteMany({
    where: {
      id: parseInt(req.params.photoId),
      ministryId: String(req.params.ministryId),
      mediaType: 'photo',
    },
  });
  return res.json({ message: 'Foto eliminada' });
});

router.post('/ministry/:ministryId/video', jwtAuth, memoryUpload.single('video'), async (req, res) => {
  const ministryId = String(req.params.ministryId);
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó video' });
  if (!req.file.mimetype.startsWith('video/')) {
    return res.status(400).json({ error: 'El archivo debe ser un video' });
  }

  const maxSort = await prisma.ministryVideo.aggregate({
    where: { ministryId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const video = await prisma.ministryVideo.create({
    data: {
      ministryId,
      videoData: req.file.buffer,
      videoMime: req.file.mimetype,
      videoName: req.file.originalname,
      sortOrder,
    },
  });
  return res.json({
    message: 'Video guardado',
    videoId: video.id,
    videoUrl: `/api/ministry/${ministryId}/video/${video.id}`,
    videoName: video.videoName,
  });
});

router.get('/ministry/:ministryId/video/:videoId', async (req, res) => {
  const video = await prisma.ministryVideo.findFirst({
    where: {
      id: parseInt(req.params.videoId),
      ministryId: String(req.params.ministryId),
    },
  });
  if (!video || !video.videoData) return res.status(404).json({ error: 'No hay video' });
  res.set('Content-Type', video.videoMime ?? 'video/mp4');
  res.set('Content-Disposition', `inline; filename="${video.videoName ?? 'video.mp4'}"`);
  res.set('Accept-Ranges', 'bytes');
  res.set('Cache-Control', 'public, max-age=86400');
  return res.send(Buffer.from(video.videoData));
});

router.delete('/ministry/:ministryId/video/:videoId', jwtAuth, async (req, res) => {
  await prisma.ministryVideo.deleteMany({
    where: {
      id: parseInt(req.params.videoId),
      ministryId: String(req.params.ministryId),
    },
  });
  return res.json({ message: 'Video eliminado' });
});

router.post('/ministry/:ministryId/card-image', jwtAuth, memoryUpload.single('image'), async (req, res) => {
  const ministryId = String(req.params.ministryId);
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'El archivo debe ser una imagen' });
  }

  const card = await prisma.ministryCardImage.upsert({
    where: { ministryId },
    create: {
      ministryId,
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
    update: {
      imageData: req.file.buffer,
      imageMime: req.file.mimetype,
      imageName: req.file.originalname,
    },
  });
  return res.json({
    message: 'Imagen de card guardada',
    cardImageUrl: `/api/ministry/${ministryId}/card-image`,
    imageName: card.imageName,
  });
});

router.get('/ministry/:ministryId/card-image', async (req, res) => {
  const card = await prisma.ministryCardImage.findUnique({
    where: { ministryId: String(req.params.ministryId) },
  });
  if (!card || !card.imageData) return res.status(404).json({ error: 'No hay imagen de card' });
  return sendBinary(res, card.imageData, card.imageMime ?? 'image/jpeg');
});

router.delete('/ministry/:ministryId/card-image', jwtAuth, async (req, res) => {
  await prisma.ministryCardImage.deleteMany({
    where: { ministryId: String(req.params.ministryId) },
  });
  return res.json({ message: 'Imagen de card eliminada' });
});

// ========== CONTACT INFO ==========
router.get('/contact-info', jwtAuth, async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) {
    c = await prisma.contact.create({
      data: {
        email: 'elviveiglesia@gmail.com',
        phone: '+54 (11) 503-621-41',
        address: 'Juan Manuel de Rosas 23.380, Ruta 3, Km 40. Virrey del Pino.',
        city: 'La Matanza, Buenos Aires, Argentina',
        socialMedia: { facebook: '', instagram: '', youtube: '', whatsapp: '', tiktok: '', twitter: '' },
        schedules: { sunday: '10:00 AM - 12:00 PM', wednesday: '7:00 PM - 9:00 PM' },
        departments: [],
      },
    });
  }
  return res.json({
    id: c.id,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    socialMedia: c.socialMedia ?? [],
    schedules: c.schedules ?? [],
    departments: c.departments ?? [],
    mapEmbed: c.mapEmbed ?? '',
    additionalInfo: c.additionalInfo ?? '',
    pageContent: c.pageContent ?? [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  });
});

router.put('/contact-info', jwtAuth, async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) {
    c = await prisma.contact.create({ data: req.body });
    return res.status(201).json(c);
  }
  await prisma.contact.update({ where: { id: c.id }, data: req.body });
  return res.json(await prisma.contact.findUnique({ where: { id: c.id } }));
});

router.patch('/contact-info/basic', jwtAuth, async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) c = await prisma.contact.create({ data: {} });
  const data = {
    email: req.body.email ?? c.email,
    phone: req.body.phone ?? c.phone,
    address: req.body.address ?? c.address,
    city: req.body.city ?? c.city,
  };
  if (req.body.mapEmbed !== undefined) data.mapEmbed = req.body.mapEmbed;
  await prisma.contact.update({ where: { id: c.id }, data });
  return res.json(await prisma.contact.findUnique({ where: { id: c.id } }));
});

router.patch('/contact-info/social-media', jwtAuth, async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) c = await prisma.contact.create({ data: {} });
  await prisma.contact.update({
    where: { id: c.id },
    data: { socialMedia: req.body.socialMedia ?? c.socialMedia },
  });
  return res.json(await prisma.contact.findUnique({ where: { id: c.id } }));
});

router.patch('/contact-info/schedules', jwtAuth, async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) c = await prisma.contact.create({ data: {} });
  await prisma.contact.update({
    where: { id: c.id },
    data: { schedules: req.body.schedules ?? c.schedules },
  });
  return res.json(await prisma.contact.findUnique({ where: { id: c.id } }));
});

router.patch('/contact-info/departments', jwtAuth, async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) c = await prisma.contact.create({ data: {} });
  await prisma.contact.update({
    where: { id: c.id },
    data: { departments: req.body.departments ?? c.departments },
  });
  return res.json(await prisma.contact.findUnique({ where: { id: c.id } }));
});

router.patch('/contact-info/page-content', jwtAuth, async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) c = await prisma.contact.create({ data: {} });
  await prisma.contact.update({
    where: { id: c.id },
    data: { pageContent: req.body.pageContent ?? c.pageContent },
  });
  return res.json(await prisma.contact.findUnique({ where: { id: c.id } }));
});

// ========== LAYOUT ==========
router.get('/layout', jwtAuth, async (req, res) => {
  let layout = await prisma.layout.findFirst();
  if (!layout) {
    layout = await prisma.layout.create({
      data: {
        navLinks: [
          { label: 'Inicio', path: '/' },
          { label: 'Ministerios', path: '/ministerios' },
          { label: 'Días de Reunión', path: '/dias-reunion' },
          { label: 'Contacto', path: '/contacto' },
        ],
        footerBrandTitle: 'ÉL VIVE IGLESIA',
        footerBrandDescription: 'Una comunidad de fe dedicada a servir a Dios y a nuestra comunidad.',
        quickLinks: [
          { label: 'Días de Reunión', path: '/dias-reunion' },
          { label: 'Ministerios', path: '/ministerios' },
          { label: 'Contacto', path: '/contacto' },
        ],
      },
    });
  }
  return res.json({
    id: layout.id,
    navLinks: layout.navLinks ?? [],
    footerBrandTitle: layout.footerBrandTitle ?? '',
    footerBrandDescription: layout.footerBrandDescription ?? '',
    footerFacebookUrl: layout.footerFacebookUrl ?? '',
    footerInstagramUrl: layout.footerInstagramUrl ?? '',
    footerYoutubeUrl: layout.footerYoutubeUrl ?? '',
    footerAddress: layout.footerAddress ?? '',
    footerEmail: layout.footerEmail ?? '',
    footerPhone: layout.footerPhone ?? '',
    footerCopyright: layout.footerCopyright ?? '',
    footerPrivacyUrl: layout.footerPrivacyUrl ?? '#',
    footerTermsUrl: layout.footerTermsUrl ?? '#',
    quickLinks: layout.quickLinks ?? [],
  });
});

router.put('/layout', jwtAuth, async (req, res) => {
  let layout = await prisma.layout.findFirst();
  if (!layout) layout = await prisma.layout.create({ data: {} });
  const fields = [
    'navLinks', 'footerBrandTitle', 'footerBrandDescription',
    'footerFacebookUrl', 'footerInstagramUrl', 'footerYoutubeUrl',
    'footerAddress', 'footerEmail', 'footerPhone',
    'footerCopyright', 'footerPrivacyUrl', 'footerTermsUrl', 'quickLinks',
  ];
  const data = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  }
  await prisma.layout.update({ where: { id: layout.id }, data });
  return res.json(await prisma.layout.findUnique({ where: { id: layout.id } }));
});

router.patch('/layout', jwtAuth, async (req, res) => {
  let layout = await prisma.layout.findFirst();
  if (!layout) layout = await prisma.layout.create({ data: {} });
  const fields = [
    'navLinks', 'footerBrandTitle', 'footerBrandDescription',
    'footerFacebookUrl', 'footerInstagramUrl', 'footerYoutubeUrl',
    'footerAddress', 'footerEmail', 'footerPhone',
    'footerCopyright', 'footerPrivacyUrl', 'footerTermsUrl', 'quickLinks',
  ];
  const data = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  }
  await prisma.layout.update({ where: { id: layout.id }, data });
  return res.json(await prisma.layout.findUnique({ where: { id: layout.id } }));
});

// ========== EVENTS (Legacy CRUD) ==========
router.get('/events', jwtAuth, async (req, res) => {
  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(events);
});

router.post('/events', jwtAuth, async (req, res) => {
  const e = await prisma.event.create({ data: req.body });
  return res.status(201).json(e);
});

router.put('/events/:id', jwtAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.event.update({ where: { id }, data: req.body });
  return res.json(await prisma.event.findUnique({ where: { id } }));
});

router.delete('/events/:id', jwtAuth, async (req, res) => {
  await prisma.event.delete({ where: { id: parseInt(req.params.id) } });
  return res.json({ message: 'Evento eliminado exitosamente' });
});

// ========== MINISTRIES (Legacy CRUD - ministry_items) ==========
router.get('/ministries', jwtAuth, async (req, res) => {
  const list = await prisma.ministryItem.findMany();
  return res.json(list);
});

router.post('/ministries', jwtAuth, async (req, res) => {
  const m = await prisma.ministryItem.create({ data: req.body });
  return res.status(201).json(m);
});

router.put('/ministries/:id', jwtAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.ministryItem.update({ where: { id }, data: req.body });
  return res.json(await prisma.ministryItem.findUnique({ where: { id } }));
});

router.delete('/ministries/:id', jwtAuth, async (req, res) => {
  await prisma.ministryItem.delete({ where: { id: parseInt(req.params.id) } });
  return res.json({ message: 'Ministerio eliminado exitosamente' });
});

// ========== CONTACT MESSAGES ==========
router.post('/contact', async (req, res) => {
  const msg = await prisma.contactMessage.create({ data: req.body });
  return res.status(201).json({ message: 'Mensaje enviado exitosamente', contact: msg });
});

router.get('/contact', jwtAuth, async (req, res) => {
  const list = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(list);
});

router.get('/contact/:id', jwtAuth, async (req, res) => {
  const msg = await prisma.contactMessage.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!msg) return res.status(404).json({ error: 'No encontrado' });
  return res.json(msg);
});

router.delete('/contact/:id', jwtAuth, async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: parseInt(req.params.id) } });
  return res.json({ message: 'Mensaje eliminado exitosamente' });
});

// ========== MEDIA ==========
router.post('/media/upload', jwtAuth, mediaUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
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

router.post('/media/upload-icon', jwtAuth, mediaUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
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

router.get('/media', jwtAuth, async (req, res) => {
  const { type } = req.query;
  const where = type ? { type } : {};
  const list = await prisma.media.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return res.json(list);
});

router.delete('/media/:id', jwtAuth, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!media) return res.status(404).json({ error: 'Archivo no encontrado' });

  const fullPath = path.join(__dirname, '../../storage/app/public', media.path.replace('/storage/', ''));
  if (existsSync(fullPath)) unlinkSync(fullPath);

  await prisma.media.delete({ where: { id: media.id } });
  return res.json({ message: 'Archivo eliminado exitosamente' });
});

export { router as apiRoutes };
