type Props = { className?: string; fill?: string; iconFill?: string; width?: number; height?: number };

export function IconSendMessage({ className = '', fill = 'currentColor', iconFill = 'white', width = 40, height = 40 }: Props) {
  return (
    <svg width={width} height={height} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="11" fill={fill} />
      <path
        d="M13.7665 26.7223C13.4645 26.8429 13.1779 26.8173 12.9068 26.6453C12.6356 26.4733 12.5 26.2228 12.5 25.8938V21.6725L19.423 19.9995L12.5 18.3265V14.1053C12.5 13.7763 12.6356 13.5258 12.9068 13.3538C13.1779 13.1818 13.4645 13.1561 13.7665 13.2768L27.723 19.161C28.0948 19.3275 28.2807 19.6076 28.2807 20.0013C28.2807 20.3949 28.0948 20.6739 27.723 20.838L13.7665 26.7223Z"
        fill={iconFill}
      />
    </svg>
  );
}
