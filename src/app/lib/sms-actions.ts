'use server'

import { ApprovalStatus, PrismaClient, Scope } from '@prisma/client'
import { createSecretKey, randomInt } from 'node:crypto'
import { getMe } from '@/app/lib/user-actions'
import { SignJWT } from 'jose'
import Client, { SendSmsRequest } from '@alicloud/dysmsapi20170525'
import { Config } from '@alicloud/openapi-client'

const prisma = new PrismaClient()
const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')

const aliyun = new Client(new Config({
    endpoint: process.env.ALIYUN_ENDPOINT!,
    accessKeyId: process.env.ALIYUN_ACCESSKEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESSKEY_SECRET!,
    type: 'access_key',
    regionId: process.env.ALIYUN_REGION!
}))

export async function sendVerificationCode(phone: string): Promise<boolean> {
    // Send a verification code to the phone number
    const user = await getMe()
    if (new Date().getTime() - user.lastSMSVerify.getTime() < 90000) {
        return false
    }

    const phoneFirst = phone.replace('+86', '').replace(/ /g, '')
    if (phoneFirst.length !== 11 || !phoneFirst.startsWith('1')) {
        return false
    }

    const correctCode = randomInt(100000, 999999)
    try {
        await aliyun.sendSms(new SendSmsRequest({
            phoneNumbers: phoneFirst,
            signName: process.env.ALIYUN_SIGNATURE_NAME!,
            templateCode: process.env.ALIYUN_TEMPLATE_CODE_SMS!,
            templateParam: JSON.stringify({
                code: correctCode
            })
        }))
        console.log(`[Authorization] Sending SMS to ${phone}: ${correctCode}`)

        await prisma.user.update({
            where: {seiueId: user.seiueId},
            data: {
                lastSMSVerify: new Date(),
                lastSMSPhone: phone,
                lastSMSCode: correctCode.toString()
            }
        })
    } catch (e) {
        console.log(`[Authorization] While sending SMS to ${phone}:`)
        console.error(e)
        return false
    }

    return true
}

export async function authorizeSMSForCode(code: string, application: number, scopes: Scope[], state: string | null, redirectURI: string): Promise<string | null> {
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
