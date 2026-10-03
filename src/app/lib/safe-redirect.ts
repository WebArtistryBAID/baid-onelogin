const placeholderOrigin = 'https://redirect.invalid'

// Only allow redirects to paths on this site. Parsing with the URL API also
// catches tricks like `/\evil.com` that browsers treat as `//evil.com`.
export function safeRedirect(value: unknown, fallback: string = '/'): string {
    if (typeof value !== 'string' || !value.startsWith('/')) {
        return fallback
    }
    try {
        const url = new URL(value, placeholderOrigin)
        if (url.origin !== placeholderOrigin) {
            return fallback
        }
        return url.pathname + url.search + url.hash
    } catch {
        return fallback
    }
}

export function appendQuery(target: string, params: Record<string, string | null | undefined>): string {
    const url = new URL(target, placeholderOrigin)
    for (const [ key, value ] of Object.entries(params)) {
        if (value != null) {
            url.searchParams.set(key, value)
        }
    }
    if (url.origin === placeholderOrigin) {
        return url.pathname + url.search + url.hash
    }
    return url.toString()
}
