import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seoSettings } from '@/db/schema';
import { requireAdmin } from '@/lib/api/admin-auth';

const defaults = {
  homepageTitle: 'Safetly | Smart Parental Control & Family Safety',
  homepageDescription:
    'Safetly helps parents keep children safer with parental controls, screen-time tools, location monitoring, and family protection.',
  keywords: [
    'parental control app',
    'family safety app',
    'child safety',
    'Safetly',
  ],
  ogImage: '/hero.png',
  twitterTitle: 'Safetly | Smart Parental Control & Family Safety',
  canonicalSiteUrl: 'https://safetly.app',
};

export async function GET() {
  const [settings] = await db().select().from(seoSettings).limit(1);
  return NextResponse.json({ settings: settings ?? defaults });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json(
      { error: 'Invalid SEO settings.' },
      { status: 400 }
    );
  const value = body as Record<string, unknown>;
  const homepageTitle =
    typeof value.homepageTitle === 'string' ? value.homepageTitle.trim() : '';
  const homepageDescription =
    typeof value.homepageDescription === 'string'
      ? value.homepageDescription.trim()
      : '';
  const keywords = Array.isArray(value.keywords)
    ? value.keywords
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : null;
  const ogImage = typeof value.ogImage === 'string' ? value.ogImage.trim() : '';
  const twitterTitle =
    typeof value.twitterTitle === 'string' ? value.twitterTitle.trim() : '';
  const canonicalSiteUrl =
    typeof value.canonicalSiteUrl === 'string'
      ? value.canonicalSiteUrl.trim()
      : '';
  if (!homepageTitle || !homepageDescription || !keywords || !canonicalSiteUrl)
    return NextResponse.json(
      {
        error: 'Title, description, keywords, and canonical URL are required.',
      },
      { status: 400 }
    );

  const [existing] = await db()
    .select({ id: seoSettings.id })
    .from(seoSettings)
    .limit(1);
  const data = {
    homepageTitle,
    homepageDescription,
    keywords,
    ogImage: ogImage || null,
    twitterTitle: twitterTitle || null,
    canonicalSiteUrl,
  };
  const [settings] = existing
    ? await db()
        .update(seoSettings)
        .set(data)
        .where(eq(seoSettings.id, existing.id))
        .returning()
    : await db().insert(seoSettings).values(data).returning();
  return NextResponse.json({ settings });
}
