type IconProps = { className?: string; color?: string; bgColor?: string }

export function IconSocialLinkedin({ className, color = 'currentColor', bgColor = 'transparent' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="20" fill={bgColor} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.4917 12.6048C15.4917 13.7825 14.6051 14.7248 13.1814 14.7248H13.1553C11.7846 14.7248 10.8984 13.7825 10.8984 12.6048C10.8984 11.4023 11.8116 10.4863 13.2083 10.4863C14.6051 10.4863 15.4652 11.4023 15.4917 12.6048ZM15.2216 16.3988V28.6634H11.1386V16.3988H15.2216ZM29.9459 28.6635L29.9461 21.6313C29.9461 17.8641 27.9318 16.1108 25.245 16.1108C23.0772 16.1108 22.1067 17.3012 21.5648 18.1363V16.3991H17.4814C17.5352 17.55 17.4814 28.6638 17.4814 28.6638H21.5648V21.8142C21.5648 21.4477 21.5913 21.082 21.6992 20.8196C21.9944 20.0873 22.6662 19.3291 23.7942 19.3291C25.2723 19.3291 25.8631 20.4537 25.8631 22.1019V28.6635H29.9459Z"
        fill={color}
      />
    </svg>
  )
}
