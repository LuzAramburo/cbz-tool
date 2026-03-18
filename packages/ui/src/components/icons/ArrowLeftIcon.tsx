import { iconSizes, type IconSize } from './iconSize';

export default function ArrowLeftIcon({ size = 'lg' }: { size?: IconSize }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={iconSizes[size]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
