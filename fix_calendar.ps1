# Script para corrigir a função updateCalendarCache
# Execute este script na raiz do projeto: .\fix_calendar.ps1

$filePath = "src\lib\services\cronUpdateService.ts"
$content = Get-Content $filePath -Raw

# Regex para encontrar e substituir a função completa
$pattern = '(?s)(\/\*\*\s*\n\s*\* Update calendar cache for movies, tv, and overall\s*\n\s*\*\/\s*\nexport async function updateCalendarCache\(\): Promise<string\[\]> \{).*?(^\}$)'

$replacement = @'
/**
 * Update calendar cache for movies, tv, and overall
 * Fetches from /overall endpoint and filters by type
 */
export async function updateCalendarCache(): Promise<string[]> {
    const apiKey = process.env.FLIXPATROL_API_KEY || process.env.NEXT_PUBLIC_FLIXPATROL_API_KEY;
    if (!apiKey) {
        throw new Error('FlixPatrol API key not found');
    }

    const updates: string[] = [];

    try {
        // Fetch only from overall endpoint (has standardized format)
        console.log(`[Cron] Fetching calendar overall...`);

        const response = await fetch(`${API_BASE_URL}/api/quick/calendar/overall`, {
            headers: { 'X-API-Key': apiKey },
        });

        if (!response.ok) {
            console.error(`[Cron] Calendar API error: ${response.status}`);
            throw new Error(`Calendar API returned ${response.status}`);
        }

        const data = await response.json();
        
        // Extract releases array
        const releases: any[] = data.releases || [];
        console.log(`[Cron] Received ${releases.length} total calendar items`);

        // Convert all items to RadarItem format
        const allRadar Items: RadarItem[] = [];
        let skippedCount = 0;

        for (const item of releases) {
            // Overall endpoint uses flat structure with tmdb_id, poster_path, etc.
            if (item.tmdb_id && item.type) {
                const radarItem: RadarItem = {
                    id: item.tmdb_id,
                    tmdbMediaType: item.type === 'movie' ? 'movie' : 'tv',
                    title: item.title,
                    releaseDate: item.releaseDate,
                    type: item.type === 'movie' ? 'movie' : 'tv',
                    listType: 'upcoming',
                    season_info: item.season_info,
                    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
                    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
                    overview: item.overview,
                    voteAverage: item.vote_average,
                    genres: item.genres,
                };
                allRadarItems.push(removeUndefined(radarItem));
            } else {
                skippedCount++;
            }
        }

        if (skippedCount > 0) {
            console.log(`[Cron] ⚠️ Skipped ${skippedCount}/${releases.length} items without tmdb_id`);
        }

        console.log(`[Cron] Successfully converted ${allRadarItems.length} calendar items`);

        // Filter and save to each cache type
        const movieItems = allRadarItems.filter(item => item.type === 'movie');
        const tvItems = allRadarItems.filter(item => item.type === 'tv');

        // Save calendar-movies
        await db.collection('public').doc('calendar-movies').set({
            items: movieItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.CALENDAR,
            cacheType: 'calendar-movies',
        });
        updates.push(`calendar-movies (${movieItems.length} items)`);
        console.log(`[Cron] ✅ Updated calendar-movies`);

        // Save calendar-tv
        await db.collection('public').doc('calendar-tv').set({
            items: tvItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.CALENDAR,
            cacheType: 'calendar-tv',
        });
        updates.push(`calendar-tv (${tvItems.length} items)`);
        console.log(`[Cron] ✅ Updated calendar-tv`);

        // Save calendar-overall (all items)
        await db.collection('public').doc('calendar-overall').set({
            items: allRadarItems,
            lastUpdated: Date.now(),
            expiresAt: Date.now() + CACHE_VALIDITY.CALENDAR,
            cacheType: 'calendar-overall',
        });
        updates.push(`calendar-overall (${allRadarItems.length} items)`);
        console.log(`[Cron] ✅ Updated calendar-overall`);

        return updates;
    } catch (error) {
        console.error('[Cron] Error updating calendar cache:', error);
        throw error;
    }
}
'@

# Fazer a substituição
$newContent = $content -replace $pattern, $replacement

# Salvar o arquivo
Set-Content $filePath -Value $newContent -NoNewline

Write-Host "✅ Função updateCalendarCache atualizada com sucesso!" -ForegroundColor Green
