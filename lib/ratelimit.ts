interface RateLimitEntry {
  count: number
  resetAt: number
}

function makeStore() {
  const store = new Map<string, RateLimitEntry>()
  return function check(
    ip: string,
    maxAttempts: number,
    windowMs: number
  ): { ok: boolean; retryAfter?: number } {
    const now = Date.now()
    const key = ip
    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return { ok: true }
    }

    if (entry.count >= maxAttempts) {
      return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
    }

    entry.count++
    return { ok: true }
  }
}

const loginStore = makeStore()
const postStore = makeStore()

export function checkRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  return loginStore(ip, 5, 15 * 60 * 1000)
}

export function checkPostRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  return postStore(ip, 10, 60 * 1000)
}
