import {cookies} from 'next/headers'
import {decodeJwt, jwtVerify} from 'jose'

export async function findUserOrThrow(): Promise<number> {
    const user = await findUserInternalCookie()
    if (user == null) {
        throw Error('Unauthorized')
    }
    return user
}

export async function findUserInternalCookie(): Promise<number | null> {
    if (!(await cookies()).has('access_token')) {
        return null
    }
    return findUserInternal((await cookies()).get('access_token')!.value)
}

// Used for internal purposes, find user based on cookies
export async function findUserInternal(token: string): Promise<number | null> {
    try {
        await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
    } catch {
        return null
    }
    const data = decodeJwt(token)
    if (data.type !== 'internal') {
        throw Error('Invalid token type (must be internal)')
    }
    return data.seiueId as number
}
