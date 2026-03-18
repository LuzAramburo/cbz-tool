import { iconSizes, type IconSize } from './iconSize';

export default function CloseIcon({ size = 'md' }: { size?: IconSize }) {
  return (
    <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
