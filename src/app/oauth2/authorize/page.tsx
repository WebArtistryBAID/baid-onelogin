import Authorize from '@/app/oauth2/authorize/Authorize'
import { SignJWT } from 'jose'
import { createSecretKey } from 'node:crypto'
import Error from '@/app/oauth2/authorize/Error'

const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')

export default async function AuthorizePage({ searchParams }: { searchParams: never }) {
    if (!('client_id' in searchParams) || !('response_type' in searchParams) || !('redirect_uri' in searchParams) || !('scope' in searchParams)) {
        return <Error message="errorParameters"/>
    }

    const token = await new SignJWT({
        redirectURI: searchParams['redirect_uri'],
        app: searchParams['client_id'],
        type: 'csrf'
    })
        .setIssuedAt()
        .setIssuer('https://beijing.academy')
        .setAudience('https://beijing.academy')
        .setExpirationTime('1 hour')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
    return <Authorize csrfToken={token}/>
}
