import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const protectedRoutes = [
    '/',
    '/user',
    '/user/applications',
    '/user/applications/create',
    '/user/applications/view',
    '/approvals',
    '/authorizations',
    '/oauth2/authorize',
    '/oauth2/token'
]

export default async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const path = req.nextUrl.pathname
    if (!protectedRoutes.includes(path)) {
        return null
    }
    const redirect = `https://passport.seiue.com/authorize?response_type=token&client_id=${process.env.SEIUE_CLIENT_ID}&school_id=452&scope=reflection.read_basic&redirect_uri=${encodeURIComponent(`${process.env.HOSTED}/auth/callback?redirect=${encodeURIComponent(req.url)}`)}`

    const cookie = cookies().get('access_token')?.value
    if (cookie == null) {
        return NextResponse.redirect(new URL(redirect, req.nextUrl))
    }
    try {
        await jwtVerify(cookie, new TextEncoder().encode(process.env.JWT_SECRET!))
    } catch {
        return NextResponse.redirect(new URL(redirect, req.nextUrl))
    }

    return null
}
