import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getArgentinaNow() {
  try {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  } catch {
    return new Date();
  }
}

export function getDayVariant(date) {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  if ([4, 5, 6, 0].includes(day)) {
    return { variant: 1, label: 'thursdayToSunday' };
  }
  if ([1, 3].includes(day)) {
    return { variant: 2, label: 'mondayWednesday' };
  }
  return { variant: 1, label: 'default' };
}

export async function getCurrentThemeForToday() {
  const now = getArgentinaNow();
  const dayInfo = getDayVariant(now);
  const variant = dayInfo.variant;
  const label = dayInfo.label;

  let home = await prisma.home.findFirst();
  if (!home) {
    home = await prisma.home.create({ data: {} });
  }

  let theme = null;
  if (home.currentTheme) {
    theme = await prisma.theme.findUnique({ where: { id: home.currentTheme } });
  }
  if (!theme) {
    theme = await prisma.theme.findFirst();
  }

  if (!theme) {
    return {
      context: { variant, variantLabel: label, now: now.toISOString() },
      videoUrl: null,
      iconUrl: null,
      palette: null,
      theme: null,
    };
  }

  const useFirst = variant === 1;

  const themeVideoUrl = useFirst
    ? (home.video1Url || theme.videoUrl1 || null)
    : (home.video2Url || theme.videoUrl2 || null);

  const iconUrl = useFirst ? (theme.iconUrl1 || null) : (theme.iconUrl2 || null);
  const palette = useFirst ? theme.palette1 : theme.palette2;

  return {
    context: { variant, variantLabel: label, now: now.toISOString() },
    videoUrl: themeVideoUrl,
    iconUrl,
    palette,
    theme: theme,
  };
}
