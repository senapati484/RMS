'use client'
import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'
import { jsonFetcher } from '@/lib/fetcher'

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: jsonFetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10_000,
        focusThrottleInterval: 30_000,
        errorRetryCount: 2,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
