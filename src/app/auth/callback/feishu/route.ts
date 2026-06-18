import { NextRequest, NextResponse } from 'next/server'
import { loginWithFeishu } from '@/app/auth/callback/login'

export async function GET(request: NextRequest): Promise<NextResponse> {
    const target = await loginWithFeishu(
        request.nextUrl.searchParams.get('code'),
        request.nextUrl.searchParams.get('state')
    )
    return NextResponse.redirect(new URL(target, request.nextUrl.origin))
}
