'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { userApi } from '@/lib/api/client'
import { persistAffiliateTracking } from '@/lib/affiliate-tracking'

export function AffiliateTracker() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    const slug = searchParams.get('r')
    if (!slug) return

    const key = `${pathname}:${slug}`
    if (handledRef.current === key) return
    handledRef.current = key

    void userApi
      .registerAffiliateClick({
        slug,
        landing_path: pathname || '/',
        referrer_url: typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
      })
      .then((response) => {
        persistAffiliateTracking(response.data)
      })
      .catch(() => {
        handledRef.current = null
      })
  }, [pathname, searchParams])

  return null
}
