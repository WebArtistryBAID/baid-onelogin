import {NextRequest, NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {jwtVerify} from 'jose'

const protectedRoutes = [
    '/',
    '/user',
    '/user/applications',
    '/user/applications/create',
    '/user/applications/view',
    '/approvals',
    '/authorizations',
    '/oauth2/authorize'
]

export default async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const path = req.nextUrl.pathname
    if (!protectedRoutes.includes(path)) {
        return null
    }
    const cookie = cookies().get('access_token')?.value
    if (cookie == null) {
        return NextResponse.redirect(new URL(`/auth?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.nextUrl))
    }
    try {
        await jwtVerify(cookie, new TextEncoder().encode(process.env.JWT_SECRET!))
    } catch {
        return NextResponse.redirect(new URL(`/auth?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.nextUrl))
    }

    return null
}
