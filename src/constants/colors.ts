/**
 * Centralização de cores para garantir consistência visual (UI/UX Lock)
 * NUNCA use cores hex diretamente nos componentes.
 */

export const STREAMING_COLORS = {
    netflix: '#dc2626',
    prime: '#1e3a8a',
    disney: '#3b82f6',
    hbo: '#9333ea',
    apple: '#6b7280',
    global: '#f59e0b',
} as const;

export const THEME_COLORS = {
    primary: '#9333ea', // Purple-600
    secondary: '#4f46e5', // Indigo-600
    accent: '#ec4899', // Pink-500
    success: '#22c55e', // Green-500
    warning: '#f59e0b', // Amber-500
    danger: '#ef4444', // Red-500
    info: '#3b82f6', // Blue-500
} as const;
