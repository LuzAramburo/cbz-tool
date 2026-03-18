export const iconSizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' } as const;

export type IconSize = keyof typeof iconSizes;
