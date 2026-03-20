import { ButtonVariant, ButtonSize } from './types';

export const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20',
  secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
  outline: 'border-2 border-gray-700 hover:border-gray-500 text-white bg-transparent',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
  danger: 'bg-orange-600 hover:bg-orange-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20',
  'outline-purple': 'border-2 border-purple-500/50 hover:border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300',
  'glow-purple': 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-100 border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] backdrop-blur-md',
  glass: 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white',
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 md:px-6 py-2 md:py-3 text-sm md:text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl font-black',
  icon: 'p-2',
};
