import { NextResponse } from 'next/server';
import { getCacheStaleness, updateSingleService, updateGlobalCache, updateTMDBCarousels, updateCalendarCache, StreamingService } from '@/lib/services/cronUpdateService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
    const startTime = Date.now();

    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateId = `update-${Date.now()}`;
    console.log(`[Cron ${updateId}] 🚀 Starting update process...`);

    try {
        const updates: string[] = [];
        const errors: string[] = [];

        // 1. Check staleness and get the MOST stale item
        console.log(`[Cron ${updateId}] Checking cache staleness...`);
        const staleness = await getCacheStaleness();

        // Pegar apenas o MAIS desatualizado com prioridade > 0
        const stalest = staleness.find(s => s.priority > 0);

        if (!stalest) {
            console.log(`[Cron ${updateId}] ✅ All caches are fresh!`);
            return NextResponse.json({
                success: true,
                updateId,
                updates: ['All caches fresh'],
                duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
                timestamp: new Date().toISOString(),
            });
        }

        console.log(`[Cron ${updateId}] Processing: ${stalest.type} (age: ${(stalest.age / 1000 / 60).toFixed(0)}min)`);

        // 2. Processar baseado no tipo
        try {
            // Top 10 services
            if (stalest.type.startsWith('top10-')) {
                const service = stalest.type.replace('top10-', '') as StreamingService;
                const result = await updateSingleService(service);
                updates.push(...result);
            }
            // Global
            else if (stalest.type.startsWith('global')) {
                const result = await updateGlobalCache();
                updates.push(...result);
            }
            // Calendar
            else if (stalest.type.startsWith('calendar-')) {
                const result = await updateCalendarCache();
                updates.push(...result);
            }
            // TMDB carousels
            else if (['now-playing', 'popular-movies', 'on-the-air', 'popular-tv', 'trending'].includes(stalest.type)) {
                const result = await updateTMDBCarousels();
                updates.push(...result);
            }

        } catch (error) {
            console.error(`[Cron ${updateId}] ❌ Update failed:`, error);
            errors.push(`${stalest.type}: ${error}`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Cron ${updateId}] ✅ Complete in ${duration}s`);
        console.log(`[Cron ${updateId}] Updates:`, updates);

        // Próximo na fila
        const nextStale = staleness.filter(s => s.priority > 0).slice(1, 2);

        return NextResponse.json({
            success: true,
            updateId,
            processed: stalest.type,
            updates,
            errors: errors.length > 0 ? errors : undefined,
            nextInQueue: nextStale.length > 0 ? nextStale[0].type : 'none',
            duration: `${duration}s`,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`[Cron ${updateId}] ❌ Fatal error:`, error);

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
