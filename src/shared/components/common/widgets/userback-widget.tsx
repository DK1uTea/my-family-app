'use client'

import Script from 'next/script'
import { useUserStore } from '@/shared/stores/use-user-store'

export function UserBackWidget() {
  const userBackToken = process.env.NEXT_PUBLIC_WIDGET_USER_BACK_ID
  const user = useUserStore((s) => s.user)

  if (!userBackToken || !user.id) return null

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <>
      <Script id="userback-settings" strategy="afterInteractive">
        {`
          window.Userback = window.Userback || {};
          window.Userback.access_token = "${userBackToken}";
          window.Userback.user_data = {
            id: "${user.id ?? ''}",
            info: {
              name: "${name}",
              email: "${user.email ?? ''}"
            }
          };
        `}
      </Script>
      <Script id="userback-widget" src="https://static.userback.io/widget/v1.js" strategy="afterInteractive" />
    </>
  )
}
