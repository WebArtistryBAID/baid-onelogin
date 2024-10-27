import Authorize from '@/app/oauth2/authorize/Authorize'
import { SignJWT } from 'jose'
import { createSecretKey } from 'node:crypto'
import Error from '@/app/oauth2/authorize/Error'
import { getMyAuthByApp } from '@/app/lib/user-actions'
import { getAppByClientID } from '@/app/lib/app-actions'
import { redirect } from 'next/navigation'
import { authorizeForCode } from '@/app/lib/authorize-actions'
import { Scope } from '@prisma/client'

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

    const app = await getAppByClientID(searchParams['client_id'])
    if (app == null) {
        return <Authorize csrfToken={token}/>
    }
    const auth = await getMyAuthByApp(app.id)
    const scopes = (searchParams['scope'] as string).split(' ')
    if (auth == null) {
        return <Authorize csrfToken={token}/>
    }
    if (!(scopes.every(s => auth.scopes.includes(s)))) {
        return <Authorize csrfToken={token}/>
    }
    const code = await authorizeForCode(app.id, scopes.map(s => s as keyof typeof Scope), 'state' in searchParams ? searchParams['state'] as string : null, searchParams['redirect_uri']!, token)
    const stateParam = 'state' in searchParams ? `&state=${searchParams['state']}` : ''
    redirect(`${searchParams['redirect_uri']}?code=${code}${stateParam}`)
}
