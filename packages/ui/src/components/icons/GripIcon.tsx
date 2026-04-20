import { IconSize, iconSizes } from './iconSize.ts';

export default function GripIcon({ size = 'md' }: { size?: IconSize }) {
  return (
    <svg className={iconSizes[size]} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9"  cy="6"  r="1.5" />
      <circle cx="15" cy="6"  r="1.5" />
      <circle cx="9"  cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9"  cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}
