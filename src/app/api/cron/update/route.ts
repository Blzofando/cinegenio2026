import { NextResponse } from 'next/server';
import { getCacheStaleness, needsUpdate, updateTop10Cache, updateTMDBCarousels } from '@/lib/services/cronUpdateService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution (Vercel Pro limit)

export async function GET(request: Request) {
    const startTime = Date.now();

    // Check authorization - accept Vercel Cron or manual with token
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron');

    if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateId = `update-${Date.now()}`;
    console.log(`[Cron ${updateId}] 🚀 Starting update process...`);

    try {
        const updates: string[] = [];
        const errors: string[] = [];

        // 1. Check staleness
        console.log(`[Cron ${updateId}] Checking cache staleness...`);
        const staleness = await getCacheStaleness();

        const needsTop10Update = needsUpdate(staleness, ['top10', 'global']);
        const needsCarouselUpdate = needsUpdate(staleness, ['upcoming', 'now-playing', 'popular', 'on-the-air', 'trending']);

        console.log(`[Cron ${updateId}] Staleness:`, {
            needsTop10Update,
            needsCarouselUpdate,
            stalestCache: staleness[0],
        });

        // 2. Update Top 10 if needed
        if (needsTop10Update) {
            try {
                console.log(`[Cron ${updateId}] 📊 Updating Top 10 caches...`);
                const top10Updates = await updateTop10Cache();
                updates.push(...top10Updates);
            } catch (error) {
                console.error(`[Cron ${updateId}] ❌ Top 10 update failed:`, error);
                errors.push(`Top 10: ${error}`);
            }
        } else {
            console.log(`[Cron ${updateId}] ⏭️ Skipping Top 10 (fresh)`);
            updates.push('Top 10: skipped (fresh)');
        }

        // 3. Update TMDB carousels if needed
        if (needsCarouselUpdate) {
            try {
                console.log(`[Cron ${updateId}] 🎬 Updating TMDB carousels...`);
                const carouselUpdates = await updateTMDBCarousels();
                updates.push(...carouselUpdates);
            } catch (error) {
                console.error(`[Cron ${updateId}] ❌ TMDB carousel failed:`, error);
                errors.push(`TMDB: ${error}`);
            }
        } else {
            console.log(`[Cron ${updateId}] ⏭️ Skipping TMDB carousels (fresh)`);
            updates.push('TMDB carousels: skipped (fresh)');
        }

        // 4. Highlights
        if (needsTop10Update || needsCarouselUpdate) {
            console.log(`[Cron ${updateId}] 💡 Highlights marked for regeneration`);
            updates.push('Highlights: marked for regeneration');
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Cron ${updateId}] ✅ Complete in ${duration}s`);
        console.log(`[Cron ${updateId}] Updates:`, updates);
        if (errors.length > 0) {
            console.log(`[Cron ${updateId}] Errors:`, errors);
        }

        return NextResponse.json({
            success: true,
            updateId,
            updates,
            errors: errors.length > 0 ? errors : undefined,
            duration: `${duration}s`,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`[Cron ${updateId}] ❌ Fatal error after ${duration}s:`, error);

        return NextResponse.json(
            {
                success: false,
                updateId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: `${duration}s`,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
