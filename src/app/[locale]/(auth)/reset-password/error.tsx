'use client'

import { ErrorPage } from '@/shared/components/common/error-page'

export default function ResetPasswordError({ error }: { error: Error }) {
  return <ErrorPage error={error} />
}
