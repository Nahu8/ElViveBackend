import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentThemeForToday } from '../services/themeService.js';
import { enrichMinistryWithMediaAsync, enrichMinistriesSummary } from '../utils/ministry-enrich.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/config/home', async (req, res) => {
  let home = await prisma.home.findFirst({
    select: {
      id: true,
      heroTitle: true,
      heroButton1Text: true,
      heroButton1Link: true,
      heroButton2Text: true,
      heroButton2Link: true,
      heroVideoUrl: true,
      celebrations: true,
      meetingDaysSummary: true,
      ministriesSummary: true,
    },
  });

  if (!home) {
    home = await prisma.home.create({ data: {} });
  }

  const hasVideo = home.id
    ? await prisma.home.findFirst({
        where: {
          id: home.id,
          OR: [{ heroVideoData: { not: null } }, { heroVideo2Data: { not: null } }],
        },
      })
    : false;

  const hasIcon = home.id
    ? await prisma.home.findFirst({
        where: {
          id: home.id,
          OR: [{ heroIconDomData: { not: null } }, { heroIconMierData: { not: null } }],
        },
      })
    : false;

  const theme = await getCurrentThemeForToday();

  const cardImages = await prisma.meetingCardImage.findMany({
    select: { cardIndex: true, imageName: true },
  });
  const cardImagesMap = Object.fromEntries(cardImages.map((c) => [c.cardIndex, c]));

  const ministriesSummary = await enrichMinistriesSummary(home.ministriesSummary);

  return res.json({
    id: home.id,
    heroTitle: home.heroTitle,
    heroButton1Text: home.heroButton1Text,
    heroButton1Link: home.heroButton1Link,
    heroButton2Text: home.heroButton2Text,
    heroButton2Link: home.heroButton2Link,
    heroVideoUrl: '/api/home/current-video',
    hasVideo: !!hasVideo,
    hasIcon: !!hasIcon,
    celebrations: home.celebrations ?? [],
    meetingDaysSummary: home.meetingDaysSummary,
    ministriesSummary,
    cardImages: cardImagesMap,
    theme: {
      context: theme.context,
      videoUrl: theme.videoUrl,
      iconUrl: theme.iconUrl,
      palette: theme.palette,
    },
  });
});

router.get('/config/contact', async (req, res) => {
  let c = await prisma.contact.findFirst();
  if (!c) {
    c = await prisma.contact.create({ data: {} });
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
    mapEmbed: c.mapEmbed,
    additionalInfo: c.additionalInfo,
    pageContent: c.pageContent ?? [],
  });
});

router.get('/config/layout', async (req, res) => {
  const defaultNav = [
    { label: 'Inicio', path: '/' },
    { label: 'Ministerios', path: '/ministerios' },
    { label: 'Días de Reunión', path: '/dias-reunion' },
    { label: 'Contacto', path: '/contacto' },
  ];
  const defaultQuick = [
    { label: 'Días de Reunión', path: '/dias-reunion' },
    { label: 'Ministerios', path: '/ministerios' },
    { label: 'Contacto', path: '/contacto' },
  ];

  let layout = await prisma.layout.findFirst();
  if (!layout) {
    layout = await prisma.layout.create({
      data: {
        navLinks: defaultNav,
        footerBrandTitle: 'ÉL VIVE IGLESIA',
        footerBrandDescription: 'Una comunidad de fe dedicada a servir a Dios y a nuestra comunidad.',
        footerFacebookUrl: 'https://www.facebook.com/profile.php?id=100081093856222',
        footerInstagramUrl: 'https://www.instagram.com/elviveiglesia/',
        footerYoutubeUrl: 'https://www.youtube.com/@elviveiglesia',
        footerAddress: 'Juan Manuel de Rosas 23.380, Ruta 3, Km 40. Virrey del Pino.',
        footerEmail: 'elviveiglesia@gmail.com',
        footerPhone: '+54 (11) 503-621-41',
        footerCopyright: '© 2025 ÉL VIVE IGLESIA. Todos los derechos reservados.',
        footerPrivacyUrl: '#',
        footerTermsUrl: '#',
        quickLinks: defaultQuick,
      },
    });
  }

  return res.json({
    navLinks: layout.navLinks ?? defaultNav,
    footerBrandTitle: layout.footerBrandTitle ?? 'ÉL VIVE IGLESIA',
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
    quickLinks: layout.quickLinks ?? defaultQuick,
  });
});

router.get('/config/ministries', async (req, res) => {
  let m = await prisma.ministriesContent.findFirst();
  if (!m) m = await prisma.ministriesContent.create({ data: {} });

  const ministries = await Promise.all(
    (m.ministries ?? []).map((min) => enrichMinistryWithMediaAsync(min))
  );

  const pageContent = m.pageContent ?? {};
  pageContent.sectionIconUrl = (await hasSectionIcon('ministries', 'section'))
    ? '/api/section-icon/ministries/section'
    : null;
  pageContent.processIconUrl = (await hasSectionIcon('ministries', 'process'))
    ? '/api/section-icon/ministries/process'
    : null;
  pageContent.testimonialsIconUrl = (await hasSectionIcon('ministries', 'testimonials'))
    ? '/api/section-icon/ministries/testimonials'
    : null;
  pageContent.faqIconUrl = (await hasSectionIcon('ministries', 'faq'))
    ? '/api/section-icon/ministries/faq'
    : null;

  return res.json({
    hero: m.hero,
    ministries,
    process: m.process,
    testimonials: m.testimonials ?? [],
    faqs: m.faqs ?? [],
    pageContent,
  });
});

router.get('/config/ministries/:id', async (req, res) => {
  const m = await prisma.ministriesContent.findFirst();
  if (!m) return res.status(404).json({ error: 'No se encontraron ministerios' });

  const list = m.ministries ?? [];
  const ministry = list.find((x) => String(x.id) === String(req.params.id));
  if (!ministry) return res.status(404).json({ error: 'Ministerio no encontrado' });

  const enriched = await enrichMinistryWithMediaAsync(ministry);
  return res.json(enriched);
});

router.get('/config/meeting-days', async (req, res) => {
  let md = await prisma.meetingDays.findFirst();
  if (!md) md = await prisma.meetingDays.create({ data: {} });

  const events = await prisma.event.findMany({ orderBy: [{ date: 'asc' }, { time: 'asc' }] });
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date && e.date >= now);

  return res.json({
    hero: md.hero,
    calendarEvents: md.calendarEvents,
    upcomingEvents: {
      ...(md.upcomingEvents ?? {}),
      events: upcoming.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        category: e.category,
        description: e.description,
      })),
    },
    eventCta: md.eventCta,
    recurringMeetings: md.recurringMeetings,
  });
});

router.get('/events/upcoming', async (req, res) => {
  const events = await prisma.event.findMany({ orderBy: [{ date: 'asc' }, { time: 'asc' }] });
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date && e.date >= now);

  const md = await prisma.meetingDays.findFirst();

  return res.json({
    section: md?.upcomingEvents,
    events: upcoming,
  });
});

router.get('/events/calendar', async (req, res) => {
  const events = await prisma.event.findMany({ orderBy: [{ date: 'asc' }, { time: 'asc' }] });
  return res.json(events);
});

async function hasSectionIcon(pageKey, sectionKey) {
  const row = await prisma.sectionIcon.findFirst({
    where: { pageKey, sectionKey },
  });
  return row && row.imageData && row.imageData.length > 0;
}

export { router as publicRoutes };
