type IconProps = { className?: string; color?: string }

export function IconCalendarNavigator({ className, color = 'currentColor' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}
