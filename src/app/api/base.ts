import { NextResponse } from 'next/server'

export function unauthorized(): NextResponse {
    return NextResponse.json(
        {
            error: 'unauthorized',
            error_description: 'Invalid access token or incorrect scope'
        }, {
            status: 401
        })
}
