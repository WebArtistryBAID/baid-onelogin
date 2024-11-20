'use server'

import { ApprovalStatus, Authorization, PrismaClient, Scope } from '@prisma/client'
import { getMe } from '@/app/lib/user-actions'
import { createSecretKey } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'
import { getAppByID, verifyAppSecretByID } from '@/app/lib/app-actions'
import { findUserOrThrow } from '@/app/lib/utils'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()
const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')

export async function authorizeForCode(application: number, scopes: Scope[], state: string | null, redirectURI: string): Promise<string | null> {
    const me = await getMe()
    if (!me) {
        return null
    }
    const app = await prisma.application.findFirst({
        where: {
            id: application
        }
    })
    if (!app) {
        return null
    }

    if (app.approved !== ApprovalStatus.approved && app.ownerId !== me.seiueId) {
        return null
    }
    if (!scopes.every(s => app.scopes.includes(s))) {
        return null
    }
    if (!app.redirectUrls.includes(redirectURI)) {
        return null
    }

    return await new SignJWT({
        user: me.seiueId,
        app: app.id,
        scopes: scopes.map(s => s.toString()),
        state: state,
        phone: null,
        redirectURI,
        type: 'authorization_code'
    })
        .setIssuedAt()
        .setIssuer('https://auth.beijing.academy')
        .setAudience(app.redirectUrls[0])
        .setExpirationTime('5 minutes')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
}

export interface TokenResponse {
    access_token: string
    token_type: 'Bearer'
    expires_in: number
    refresh_token: string
}

export interface TokenErrorResponse {
    error: string
    error_description: string
}

export async function authorizeForTokens(code: string, credentials: string, grantType: string, redirectURI: string): Promise<TokenResponse | TokenErrorResponse> {
    if (grantType !== 'authorization_code') {
        return {
            error: 'unsupported_grant_type',
            error_description: 'The provided grant type is not supported.'
        }
    }

    const cred = Buffer.from(credentials, 'base64').toString('utf-8').split(':')

    if (cred.length !== 2) {
        return {
            error: 'invalid_client',
            error_description: 'The client credentials are invalid.'
        }
    }

    let jwt
    try {
        jwt = await jwtVerify(code, secret)
    } catch {
        return {
            error: 'invalid_grant',
            error_description: 'The provided authorization code is invalid or has expired.'
        }
    }

    if (jwt.payload.type !== 'authorization_code') {
        return {
            error: 'invalid_grant',
            error_description: 'The provided authorization code is invalid or has expired.'
        }
    }

    if (jwt.payload.redirectURI !== redirectURI) {
        return {
            error: 'invalid_grant',
            error_description: 'The provided redirect URI does not match the one used to generate the authorization code.'
        }
    }

    const app = await getAppByID(jwt.payload.app as number)
    if (app == null || app.approved !== ApprovalStatus.approved) {
        return {
            error: 'invalid_grant',
            error_description: 'The provided authorization code is invalid or has expired.'
        }
    }

    if (cred[0] !== app.clientId || !(await verifyAppSecretByID(app.id!, cred[1]))) {
        return {
            error: 'invalid_client',
            error_description: 'The client credentials are invalid.'
        }
    }

    if ((await prisma.authorization.findFirst({
        where: {
            userId: jwt.payload.user as number,
            applicationId: jwt.payload.app as number
        }
    })) != null) {
        await prisma.authorization.updateMany({
            where: {
                userId: jwt.payload.user as number,
                applicationId: jwt.payload.app as number
            },
            data: {
                scopes: jwt.payload.scopes as string[],
                smsPhone: jwt.payload.phone as string | null
            }
        })
    } else {
        await prisma.authorization.create({
            data: {
                userId: jwt.payload.user as number,
                applicationId: jwt.payload.app as number,
                scopes: jwt.payload.scopes as string[],
                smsPhone: jwt.payload.phone as string | null
            }
        })
    }
    await prisma.appAuditLog.create({
        data: {
            type: 'authorizedUser',
            applicationId: app.id,
            operationUserId: jwt.payload.user as number,
            values: jwt.payload.scopes as string[]
        }
    })
    await prisma.userAuditLog.create({
        data: {
            type: 'authorizedApp',
            userId: jwt.payload.user as number,
            values: [ app.id!.toString() ]
        }
    })

    const accessToken = await new SignJWT({
        user: jwt.payload.user,
        app: jwt.payload.app,
        scopes: jwt.payload.scopes,
        type: 'access_token'
    })
        .setIssuedAt()
        .setIssuer('https://access.beijing.academy')
        .setAudience(redirectURI)
        .setExpirationTime('1 day')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
    const refreshToken = await new SignJWT({
        user: jwt.payload.user,
        app: jwt.payload.app,
        scopes: jwt.payload.scopes,
        type: 'refresh_token'
    })
        .setIssuedAt()
        .setIssuer('https://refresh.beijing.academy')
        .setAudience(redirectURI)
        .setExpirationTime('30 days')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
    return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 86400,
        refresh_token: refreshToken
    }
}

export async function refreshToken(refreshToken: string, credentials: string, grantType: string, scope: string[] | null): Promise<TokenResponse | TokenErrorResponse> {
    if (grantType !== 'refresh_token') {
        return {
            error: 'unsupported_grant_type',
            error_description: 'The provided grant type is not supported.'
        }
    }

    const cred = Buffer.from(credentials, 'base64').toString('utf-8').split(':')

    if (cred.length !== 2) {
        return {
            error: 'invalid_client',
            error_description: 'The client credentials are invalid.'
        }
    }

    let jwt
    try {
        jwt = await jwtVerify(refreshToken, secret)
    } catch {
        return {
            error: 'invalid_grant',
            error_description: 'The provided refresh token is invalid or has expired.'
        }
    }

    if (jwt.payload.type !== 'refresh_token') {
        return {
            error: 'invalid_grant',
            error_description: 'The provided refresh token is invalid or has expired.'
        }
    }

    const authorization = await prisma.authorization.findFirst({
        where: {
            userId: jwt.payload.user as number,
            applicationId: jwt.payload.app as number
        }
    })
    if (authorization == null) {
        return {
            error: 'invalid_grant',
            error_description: 'The provided refresh token is invalid or has expired.'
        }
    }
    if (!(jwt.payload.scopes as string[]).every(s => authorization.scopes.includes(s))) {
        return {
            error: 'invalid_grant',
            error_description: 'The provided refresh token is invalid or has expired.'
        }
    }

    const app = await prisma.application.findFirst({
        where: {
            id: jwt.payload.app as number
        }
    })

    if (app == null || app.approved !== ApprovalStatus.approved) {
        return {
            error: 'invalid_grant',
            error_description: 'The provided refresh token is invalid or has expired.'
        }
    }

    if (cred[0] !== app.clientId || !(await verifyAppSecretByID(app.id!, cred[1]))) {
        return {
            error: 'invalid_client',
            error_description: 'The client credentials are invalid.'
        }
    }

    if (scope == null) {
        const accessToken = await new SignJWT({
            user: jwt.payload.user,
            app: jwt.payload.app,
            scopes: jwt.payload.scopes,
            type: 'access_token'
        })
            .setIssuedAt()
            .setIssuer('https://access.beijing.academy')
            .setAudience(app.redirectUrls[0])
            .setExpirationTime('1 day')
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)
        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 86400,
            refresh_token: refreshToken
        }
    }
    if (!scope.every(s => (jwt.payload.scopes as string[]).includes(s))) {
        return {
            error: 'invalid_scope',
            error_description: 'The provided scopes are invalid.'
        }
    }
    const accessToken = await new SignJWT({
        user: jwt.payload.user,
        app: jwt.payload.app,
        scopes: scope,
        type: 'access_token'
    })
        .setIssuedAt()
        .setIssuer('https://access.beijing.academy')
        .setAudience(app.redirectUrls[0])
        .setExpirationTime('1 day')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
    const refreshTokenNew = await new SignJWT({
        user: jwt.payload.user,
        app: jwt.payload.app,
        scopes: scope,
        type: 'refresh_token'
    })
        .setIssuedAt()
        .setIssuer('https://refresh.beijing.academy')
        .setAudience(app.redirectUrls[0])
        .setExpirationTime('30 days')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
    return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 86400,
        refresh_token: refreshTokenNew
    }
}

export async function revokeToken(token: string, credentials: string): Promise<boolean> {
    const cred = Buffer.from(credentials, 'base64').toString('utf-8').split(':')

    if (cred.length !== 2) {
        return false
    }

    let jwt
    try {
        jwt = await jwtVerify(token, secret)
    } catch {
        return false
    }

    if (jwt.payload.type !== 'access_token' && jwt.payload.type !== 'refresh_token') {
        return false
    }

    const app = await getAppByID(jwt.payload.app as number)
    if (app == null) {
        return false
    }

    if (cred[0] !== app.clientId || !(await verifyAppSecretByID(app.id!, cred[1]))) {
        return false
    }

    await prisma.userAuditLog.create({
        data: {
            type: 'deauthorizedApp',
            userId: jwt.payload.user as number,
            values: [ app.id!.toString() ]
        }
    })

    await prisma.authorization.deleteMany({
        where: {
            userId: jwt.payload.user as number,
            applicationId: jwt.payload.app as number
        }
    })
    return true
}

export async function revokeMyAuthorization(auth: Authorization): Promise<void> {
    await prisma.authorization.deleteMany({
        where: {
            id: auth.id,
            userId: await findUserOrThrow()
        }
    })
    await prisma.userAuditLog.create({
        data: {
            type: 'deauthorizedApp',
            userId: await findUserOrThrow(),
            values: [ auth.applicationId.toString() ]
        }
    })
}

export async function getUserIDFromHeader(request: NextRequest): Promise<number | null> {
    const auth = request.headers.get('Authorization')
    if (auth == null || !auth.startsWith('Bearer ')) {
        return null
    }

    try {
        const jwt = await jwtVerify(auth.replace('Bearer ', ''), secret)
        return jwt.payload.user as number
    } catch {
        return null
    }
}

export async function validateFromHeader(request: NextRequest, scope: string[]): Promise<boolean> {
    const auth = request.headers.get('Authorization')
    if (auth == null || !auth.startsWith('Bearer ')) {
        return false
    }

    return await validateAccessToken(auth.replace('Bearer ', ''), scope)
}

export async function validateAccessToken(accessToken: string, scope: string[]): Promise<boolean> {
    try {
        const jwt = await jwtVerify(accessToken, secret)

        if (jwt.payload.type !== 'access_token') {
            return false
        }

        const authorization = await prisma.authorization.findFirst({
            where: {
                userId: jwt.payload.user as number,
                applicationId: jwt.payload.app as number
            }
        })
        if (authorization == null) {
            return false
        }
        // Check if the scopes in the token are a subset of the required scopes
        if (!(jwt.payload.scopes as string[]).every(s => authorization.scopes.includes(s))) {
            return false
        }

        return scope.every(s => (jwt.payload.scopes as string[]).includes(s))
    } catch {
        return false
    }
}
