import { NextResponse } from 'next/server';
import { getCacheStaleness, needsUpdate, updateTop10Cache, updateTMDBCarousels } from '@/lib/services/cronUpdateService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution

export async function GET(request: Request) {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔥 FIRE-AND-FORGET: Responde imediatamente e processa em background
    const updateId = `update-${Date.now()}`;
    console.log(`[Cron] 🚀 Update ${updateId} triggered - processing in background...`);

    // Inicia processamento em background (sem await)
    processUpdatesInBackground(updateId).catch(error => {
        console.error(`[Cron] ❌ Background update ${updateId} failed:`, error);
    });

    // Retorna imediatamente
    return NextResponse.json({
        success: true,
        message: 'Update started in background',
        updateId,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Processa atualizações em background
 */
async function processUpdatesInBackground(updateId: string) {
    const startTime = Date.now();

    try {
        console.log(`[Cron ${updateId}] Starting update process...`);

        const updates: string[] = [];
        const errors: string[] = [];

        // 1. Check staleness
        console.log(`[Cron ${updateId}] Checking cache staleness...`);
        const staleness = await getCacheStaleness();

        const needsTop10Update = needsUpdate(staleness, ['top10', 'global']);
        const needsCarouselUpdate = needsUpdate(staleness, ['upcoming', 'now-playing', 'popular']);

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
        if (needsTop10Update) {
            console.log(`[Cron ${updateId}] 💡 Highlights marked for regeneration`);
            updates.push('Highlights: marked for regeneration');
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Cron ${updateId}] ✅ Complete in ${duration}s`);
        console.log(`[Cron ${updateId}] Updates:`, updates);
        if (errors.length > 0) {
            console.log(`[Cron ${updateId}] Errors:`, errors);
        }

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`[Cron ${updateId}] ❌ Fatal error after ${duration}s:`, error);
    }
}
