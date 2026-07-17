/**
 * One-shot migration: normalise all event coverUrl values in the DB to
 * relative proxy paths (/api/v1/media/proxy/<encoded-key>).
 *
 * Run once:  npx ts-node fix_event_cover_urls.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toRelativeProxyUrl(coverUrl: string): string | null {
  if (!coverUrl) return null;

  // Already a relative proxy path — ideal
  if (coverUrl.startsWith('/api/v1/media/proxy/')) return coverUrl;

  try {
    const url = new URL(coverUrl);

    // Absolute proxy URL with any host (e.g. old server IP)
    if (url.pathname.startsWith('/api/v1/media/proxy/')) {
      return url.pathname + url.search;
    }

    // Direct S3 URL — extract key and build proxy path
    if (url.hostname.includes('amazonaws.com')) {
      const key = url.pathname.replace(/^\//, '');
      return `/api/v1/media/proxy/${encodeURIComponent(key)}`;
    }
  } catch {}

  return coverUrl; // leave unchanged if we can't parse it
}

async function main() {
  const events = await prisma.event.findMany({
    where: { coverUrl: { not: null } },
    select: { id: true, coverUrl: true },
  });

  console.log(`Found ${events.length} events with a coverUrl`);

  let fixed = 0;
  for (const event of events) {
    const normalized = toRelativeProxyUrl(event.coverUrl!);
    if (normalized !== event.coverUrl) {
      await prisma.event.update({
        where: { id: event.id },
        data: { coverUrl: normalized },
      });
      console.log(`  Fixed event ${event.id}: "${event.coverUrl}" → "${normalized}"`);
      fixed++;
    }
  }

  console.log(`\nDone. Fixed ${fixed} / ${events.length} event records.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
