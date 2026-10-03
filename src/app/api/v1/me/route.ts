import { NextRequest, NextResponse } from 'next/server'
import { getUserIDFromHeader, validateFromHeader } from '@/app/lib/authorize-actions'
import { unauthorized } from '@/app/api/base'
import { getUserSimpleByID, getUserWithPhoneByID } from '@/app/lib/user-data'

export async function GET(request: NextRequest): Promise<NextResponse> {
    if (!await validateFromHeader(request, [ 'basic' ])) {
        return unauthorized()
    }
    const userId = await getUserIDFromHeader(request)
    if (userId == null) {
        return unauthorized()
    }

    const user = await validateFromHeader(request, [ 'phone' ])
        ? await getUserWithPhoneByID(userId)
        : await getUserSimpleByID(userId)
    if (user == null) {
        return unauthorized()
    }
    return NextResponse.json(user)
}
