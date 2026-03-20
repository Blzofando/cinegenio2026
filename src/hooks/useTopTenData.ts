"use client";

import React, { useState, useEffect } from 'react';
import { RadarItem } from '@/types';
import { STREAMING_COLORS } from '@/constants/colors';

export const useTopTenData = (
    streamingService?: 'netflix' | 'prime' | 'disney' | 'hbo' | 'apple',
    globalType?: 'movies' | 'series',
    initialItems: RadarItem[] = []
) => {
    const [items, setItems] = useState<RadarItem[]>(initialItems);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (streamingService) {
            setIsLoading(true);
            import('@/lib/services/flixpatrolService')
                .then(({ getTop10 }) => getTop10(streamingService))
                .then(data => {
                    setItems(data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error(`Error loading Top 10 for ${streamingService}:`, error);
                    setIsLoading(false);
                });
        } else if (globalType) {
            setIsLoading(true);
            import('@/lib/services/flixpatrolService')
                .then(({ getGlobalTop10 }) => getGlobalTop10(globalType))
                .then(data => {
                    setItems(data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error(`Error loading global Top 10 ${globalType}:`, error);
                    setIsLoading(false);
                });
        }
    }, [streamingService, globalType]);

    const themeColor = streamingService 
        ? STREAMING_COLORS[streamingService] 
        : STREAMING_COLORS.global;

    return { items, isLoading, themeColor };
};
