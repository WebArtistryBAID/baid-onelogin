'use server'

import { ApprovalStatus, PrismaClient, Scope } from '@prisma/client'
import { createSecretKey, randomInt } from 'node:crypto'
import { getMe } from '@/app/lib/user-actions'
import { jwtVerify, SignJWT } from 'jose'

const prisma = new PrismaClient()
const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')

export async function sendVerificationCode(phone: string): Promise<boolean> {
    // Send a verification code to the phone number
    const user = await getMe()
    if (new Date().getTime() - user.lastSMSVerify.getTime() < 90000) {
        return false
    }

    const correctCode = randomInt(100000, 999999)
    // TODO: Implement this
    console.log(`[Mock] Sending SMS to ${phone}: ${correctCode}`)

    await prisma.user.update({
        where: { seiueId: user.seiueId },
        data: {
            lastSMSVerify: new Date(),
            lastSMSPhone: phone,
            lastSMSCode: correctCode.toString()
        }
    })

    return true
}

export async function authorizeSMSForCode(code: string, application: number, scopes: Scope[], state: string | null, redirectURI: string, csrfToken: string): Promise<string | null> {
    const me = await getMe()
    if (!me) {
        return null
    }
    if (me.lastSMSCode !== code || new Date().getTime() - me.lastSMSVerify.getTime() > 300000) {
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

    try {
        const csrf = await jwtVerify(csrfToken, secret)
        if (csrf.payload.type !== 'csrf' || csrf.payload.app !== app.clientId || csrf.payload.redirectURI !== redirectURI) {
            return null
        }
    } catch {
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
        phone: me.lastSMSPhone!,
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
