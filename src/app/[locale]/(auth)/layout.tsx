import { IntercomWidgetGuest } from '@/shared/components/common/widgets/intercom-widget-guest'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <IntercomWidgetGuest />
    </>
  )
}
