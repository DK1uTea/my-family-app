type IconProps = { className?: string; color?: string; bgColor?: string }

export function IconSocialYoutube({ className, color = 'currentColor', bgColor = 'transparent' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="20" fill={bgColor} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28.8302 12.4777C29.7883 12.7405 30.5427 13.515 30.7987 14.4984C31.264 16.2809 31.264 20 31.264 20C31.264 20 31.264 23.719 30.7987 25.5015C30.5427 26.485 29.7883 27.2595 28.8302 27.5225C27.0942 28 20.132 28 20.132 28C20.132 28 13.1698 28 11.4336 27.5225C10.4756 27.2595 9.72118 26.485 9.46514 25.5015C9 23.719 9 20 9 20C9 20 9 16.2809 9.46514 14.4984C9.72118 13.515 10.4756 12.7405 11.4336 12.4777C13.1698 12 20.132 12 20.132 12C20.132 12 27.0942 12 28.8302 12.4777ZM18.0468 16.8697V23.8262L23.6128 20.3481L18.0468 16.8697Z"
        fill={color}
      />
    </svg>
  )
}
