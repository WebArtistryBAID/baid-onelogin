import {NextRequest, NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {jwtVerify} from 'jose'
import {hostedURL} from '@/app/lib/hosted-url'

function isProtected(path: string): boolean {
    return path === '/' || path === '/oauth2/authorize' || path === '/user' || path.startsWith('/user/')
}

export default async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const path = req.nextUrl.pathname
    if (!isProtected(path)) {
        return null
    }
    const cookie = (await cookies()).get('access_token')?.value
    if (cookie == null) {
        return NextResponse.redirect(hostedURL(`/auth?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`))
    }
    try {
        const jwt = await jwtVerify(cookie, new TextEncoder().encode(process.env.JWT_SECRET!))
        if (jwt.payload.type !== 'internal') {
            throw new Error('Invalid token type')
        }
    } catch {
        return NextResponse.redirect(hostedURL(`/auth?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`))
    }

    return null
}
