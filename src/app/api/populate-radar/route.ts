// src/app/api/populate-radar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { updateTMDbRadarCache } from '@/lib/radar';

export async function POST(request: NextRequest) {
    try {
        console.log('Populando cache público do radar TMDb...');

        await updateTMDbRadarCache();

        return NextResponse.json({
            success: true,
            message: 'Public radar cache populated successfully'
        });
    } catch (error) {
        console.error('Error populating radar:', error);
        return NextResponse.json({
            error: 'Failed to populate radar cache',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
