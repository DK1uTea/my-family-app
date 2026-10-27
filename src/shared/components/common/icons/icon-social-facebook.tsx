type IconProps = { className?: string; color?: string; bgColor?: string }

export function IconSocialFacebook({ className, color = 'currentColor', bgColor = 'transparent' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="20" fill={bgColor} />
      <path
        d="M21.2563 30.0209V19.5092H24.1584L24.543 15.8868H21.2563L21.2612 14.0738C21.2612 13.129 21.351 12.6228 22.7082 12.6228H24.5224V9H21.6199C18.1336 9 16.9064 10.7572 16.9064 13.7124V15.8872H14.7333V19.5096H16.9064V30.0209H21.2563Z"
        fill={color}
      />
    </svg>
  )
}
