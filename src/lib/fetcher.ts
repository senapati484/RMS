// lib/fetcher.ts
// Shared SWR fetcher: same-origin relative URLs are routed through window.location.origin
// so SWR can build a stable cache key per endpoint. Includes the Bearer token when present.
export async function jsonFetcher<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const url =
    typeof input === 'string' && input.startsWith('/')
      ? new URL(input, typeof window === 'undefined' ? 'http://localhost' : window.location.origin).toString()
      : (input as string)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token') || localStorage.getItem('token')
    if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return (await res.json()) as T
}
