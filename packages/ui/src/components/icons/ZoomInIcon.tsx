import { IconSize, iconSizes } from './iconSize.ts';

export default function ZoomInIcon({ size = 'md' }: { size?: IconSize }) {
  return (
    <svg
      className={iconSizes[size]}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
    </svg>
  );
}
