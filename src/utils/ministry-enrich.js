import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function enrichMinistryWithMedia(ministry) {
  const mid = ministry?.id ?? ministry?.ministryId;
  if (!mid) return ministry;

  // Sync check - we'll enrich in route handlers with async
  return ministry;
}

export async function enrichMinistryWithMediaAsync(ministry) {
  const mid = String(ministry?.id ?? ministry?.ministryId ?? '');
  if (!mid) return ministry;

  const m = { ...ministry };

  const hasIcon = await prisma.ministryMedia.findFirst({
    where: { ministryId: mid, mediaType: 'icon' },
  });
  if (hasIcon) m.iconUrl = `/api/ministry/${mid}/icon`;

  const hasCardImage = await prisma.ministryCardImage.findFirst({
    where: { ministryId: mid },
  });
  if (hasCardImage) m.cardImageUrl = `/api/ministry/${mid}/card-image`;

  const photos = await prisma.ministryMedia.findMany({
    where: { ministryId: mid, mediaType: 'photo' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, imageName: true },
  });
  if (photos.length) {
    m.photos = photos.map((p) => ({
      id: p.id,
      url: `/api/ministry/${mid}/photo/${p.id}`,
      name: p.imageName,
    }));
  }

  const videos = await prisma.ministryVideo.findMany({
    where: { ministryId: mid },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, videoName: true },
  });
  if (videos.length) {
    m.internalVideos = videos.map((v) => ({
      id: v.id,
      url: `/api/ministry/${mid}/video/${v.id}`,
      name: v.videoName,
    }));
  }

  return m;
}

export async function enrichMinistriesSummary(summary) {
  if (!summary) return summary;

  const ministryIds = summary.ministryIds ?? null;
  if (ministryIds && Array.isArray(ministryIds)) {
    const ids = ministryIds
      .slice(0, 4)
      .map(String)
      .filter(Boolean);

    const mContent = await prisma.ministriesContent.findFirst();
    const allMinistries = (mContent?.ministries ?? []).reduce((acc, m) => {
      acc[String(m?.id ?? '')] = m;
      return acc;
    }, {});

    const ministries = [];
    for (const id of ids) {
      const min = allMinistries[id];
      if (min) {
        ministries.push(await enrichMinistryWithMediaAsync(min));
      }
    }
    return { ...summary, ministries };
  }

  if (summary.ministries && Array.isArray(summary.ministries)) {
    summary.ministries = await Promise.all(
      summary.ministries.map((m) =>
        m?.id ? enrichMinistryWithMediaAsync(m) : Promise.resolve(m)
      )
    );
  }
  return summary;
}
