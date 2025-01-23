import { NextRequest, NextResponse } from 'next/server'
import { authorizationFromHeader, getUserIDFromHeader, validateFromHeader } from '@/app/lib/authorize-actions'
import { badRequest, internalError, success, tooManyRequests, unauthorized } from '@/app/api/base'
import { getUserByID } from '@/app/lib/user-actions'
import Client, { SendSmsRequest } from '@alicloud/dysmsapi20170525'
import { Config } from '@alicloud/openapi-client'
import { PrismaClient } from '@prisma/client'

const aliyun = new Client(new Config({
    endpoint: process.env.ALIYUN_ENDPOINT!,
    accessKeyId: process.env.ALIYUN_ACCESSKEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESSKEY_SECRET!,
    type: 'access_key',
    regionId: process.env.ALIYUN_REGION!
}))

const prisma = new PrismaClient()

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!await validateFromHeader(request, [ 'sms' ])) {
        return unauthorized()
    }

    const authorization = (await authorizationFromHeader(request))!
    if (authorization.smsPhone == null) {
        return unauthorized()
    }

    const user = (await getUserByID((await getUserIDFromHeader(request))!))!
    if (new Date().getTime() - user.lastSendSMS.getTime() < 90000) {
        return tooManyRequests()
    }
    const phoneFirst = authorization.smsPhone.replace('+86', '').replace(/ /g, '')
    if (phoneFirst.length !== 11 || !phoneFirst.startsWith('1')) {
        return badRequest()
    }


    const body = await request.json()

    try {
        console.log(`[SMS] Sending SMS to ${authorization.smsPhone} for user ${user.name}`)
        await prisma.user.update({
            where: { seiueId: user.seiueId },
            data: {
                lastSendSMS: new Date(),
                lastSMSPhone: phoneFirst
            }
        })
        await aliyun.sendSms(new SendSmsRequest({
            phoneNumbers: phoneFirst,
            signName: process.env.ALIYUN_SIGNATURE_NAME!,
            templateCode: body.template,
            templateParam: JSON.stringify(body.params)
        }))
    } catch (e) {
        console.error(`[SMS] While sending SMS to ${authorization.smsPhone} for user ${user.name}:`)
        console.error(e)
        return internalError('Failed to send SMS')
    }
    return success()
}