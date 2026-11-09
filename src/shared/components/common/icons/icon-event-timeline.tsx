type IconProps = { className?: string };

export function IconEventTimeline({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 2a1 1 0 0 1 1 1v14a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 6a1 1 0 0 1 1 1v1h7a1 1 0 1 1 0 2H8v1a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Zm4-7a1 1 0 0 1 1 1v1h3a1 1 0 1 1 0 2h-3v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
