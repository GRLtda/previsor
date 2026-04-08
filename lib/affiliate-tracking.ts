'use client'

export interface StoredAffiliateTracking {
  click_id: string
  campaign_slug: string
  attribution_model: 'first_click' | 'last_click' | 'logged_in'
  attribution_window_days: number
  expires_at: string
}

const STORAGE_KEY = 'previzor_affiliate_tracking'

export function getStoredAffiliateTracking(): StoredAffiliateTracking | null {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredAffiliateTracking
    if (!parsed.expires_at || new Date(parsed.expires_at).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function persistAffiliateTracking(next: StoredAffiliateTracking) {
  if (typeof window === 'undefined') return

  const current = getStoredAffiliateTracking()
  if (!current) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return
  }

  if (current.attribution_model === 'last_click' || next.attribution_model === 'last_click') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
}

export function clearAffiliateTracking() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
