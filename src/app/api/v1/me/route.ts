import { NextRequest, NextResponse } from 'next/server'
import { getUserIDFromHeader, validateFromHeader } from '@/app/lib/authorize-actions'
import { unauthorized } from '@/app/api/base'
import { getUserByID, getUserSimpleByID } from '@/app/lib/user-actions'

export async function GET(request: NextRequest): Promise<NextResponse> {
    if (!await validateFromHeader(request, [ 'basic' ])) {
        return unauthorized()
    }

    if (await validateFromHeader(request, [ 'phone' ])) {
        return NextResponse.json(await getUserByID((await getUserIDFromHeader(request))!))
    }
    return NextResponse.json(await getUserSimpleByID((await getUserIDFromHeader(request))!))
}
