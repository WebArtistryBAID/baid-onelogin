import { NextRequest, NextResponse } from 'next/server'
import { revokeToken } from '@/app/lib/authorize-actions'

export async function POST(request: NextRequest) {
    if (!request.headers.has('Authorization')) {
        return NextResponse.json(
            {
                error: 'invalid_client',
                error_description: 'The client credentials are invalid.'
            },
            {
                status: 401
            }
        )
    }
    const auth = request.headers.get('Authorization')!.replace('Basic ', '')
    const data = await request.formData()
    if (await revokeToken(data.get('token') as string, auth)) {
        return NextResponse.json({})
    }
    return NextResponse.json(
        {
            error: 'invalid_revoke',
            error_description: 'Failed to revoke the token.'
        },
        {
            status: 401
        }
    )
}
