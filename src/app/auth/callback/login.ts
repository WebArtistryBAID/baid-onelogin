'use server'

import {cookies, headers} from 'next/headers'
import {jwtVerify, SignJWT} from 'jose'
import {Gender, UserAuditLogType, UserType} from '@/generated/prisma/client'
import {createHash, createSecretKey} from 'node:crypto'
import {parsePhoneNumberFromString} from 'libphonenumber-js'
import {prisma} from '@/app/lib/prisma'
import {appendQuery, safeRedirect} from '@/app/lib/safe-redirect'

const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')
const feishuCallbackPath = '/auth/callback/feishu'

function appendError(target: string, error: string): string {
    return appendQuery(target, {error})
}

// Returns the 11-digit mainland China mobile number, or '' if the value is not
// one. Numbers from other countries are rejected so they can never collide
// with a stored mainland number (e.g. +1 380-000-0000 vs 138 0000 0000).
function normalizeMainlandMobile(value: unknown): string {
    if (typeof value !== 'string' || !value.trim().startsWith('+')) {
        return ''
    }
    const parsed = parsePhoneNumberFromString(value.trim())
    if (parsed == null || parsed.countryCallingCode !== '86' || !parsed.isValid()) {
        return ''
    }
    const national = parsed.nationalNumber.toString()
    return /^1\d{10}$/.test(national) ? national : ''
}

async function getAvailableFeishuUserId(phone: string): Promise<number> {
    const digest = createHash('sha256').update(`feishu:${phone}`).digest()
    let candidate = -Math.max(1, digest.readUInt32BE(0) % 1000000000)
    while ((await prisma.user.findUnique({where: {seiueId: candidate}})) != null) {
        candidate -= 1
    }
    return candidate
}

async function issueInternalLogin(user: { seiueId: number, name: string, pinyin: string }) {
    const token = await new SignJWT({
        seiueId: user.seiueId,
        name: user.name,
        pinyin: user.pinyin,
        type: 'internal'
    })
        .setIssuedAt()
        .setIssuer('https://beijing.academy')
        .setAudience('https://beijing.academy')
        .setExpirationTime('1 day')
        .setProtectedHeader({alg: 'HS256'})
        .sign(secret);
    (await cookies()).set('access_token', token, {
        expires: new Date(Date.now() + 86400000),
        httpOnly: true,
        secure: process.env.HOSTED?.startsWith('https://') ?? true,
        sameSite: 'lax',
        path: '/'
    })
}

export async function createFeishuState(target: string): Promise<string> {
    return await new SignJWT({
        target: safeRedirect(target),
        type: 'feishu_oauth_state'
    })
        .setIssuedAt()
        .setIssuer('https://auth.beijing.academy')
        .setAudience('https://accounts.feishu.cn')
        .setExpirationTime('10 minutes')
        .setProtectedHeader({alg: 'HS256'})
        .sign(secret)
}

async function readFeishuState(state: string | null): Promise<string | null> {
    if (state == null) {
        return null
    }
    try {
        const jwt = await jwtVerify(state, secret, {
            issuer: 'https://auth.beijing.academy',
            audience: 'https://accounts.feishu.cn'
        })
        if (jwt.payload.type !== 'feishu_oauth_state') {
            return null
        }
        return safeRedirect(jwt.payload.target)
    } catch {
        return null
    }
}

export async function loginWithAccessCode(code: string): Promise<boolean> {
    const head = await headers()
    const ip = head.get('X-Forwarded-For') ?? head.get('X-Real-IP') ?? 'localhost'
    if (code.length < 1) {
        return false
    }
    const access = await prisma.accessCode.findFirst({
        where: {
            code
        }
    })
    if (access == null) {
        return false
    }
    const user = await prisma.user.findUnique({
        where: {
            seiueId: access.userId
        }
    })
    if (user == null) {
        return false
    }
    if (!access.persistent) {
        await prisma.accessCode.deleteMany({
            where: {
                code
            }
        })
    }
    await prisma.userAuditLog.create({
        data: {
            userId: user.seiueId,
            type: UserAuditLogType.logIn,
            values: [head.get('User-Agent') ?? '', ip]
        }
    })
    await issueInternalLogin(user)
    return true
}

export async function loginWithFeishu(code: string | null, state: string | null): Promise<string> {
    const head = await headers()
    const ip = head.get('X-Forwarded-For') ?? head.get('X-Real-IP') ?? 'localhost'
    const target = await readFeishuState(state)
    if (target == null || code == null || code.length < 1) {
        return appendError(target ?? '/', 'feishu')
    }

    const redirectURI = `${process.env.HOSTED}${feishuCallbackPath}`
    const tokenResponse = await fetch('https://open.feishu.cn/open-apis/authen/v2/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: process.env.FEISHU_APP_ID,
            client_secret: process.env.FEISHU_APP_SECRET,
            code,
            redirect_uri: redirectURI
        }),
        cache: 'no-store'
    })
    if (!tokenResponse.ok) {
        return appendError(target, 'feishu')
    }
    const tokenJson = await tokenResponse.json()
    if (tokenJson.code !== 0) {
        return appendError(target, 'feishu')
    }
    const accessToken = tokenJson.access_token ?? tokenJson.data?.access_token
    if (typeof accessToken !== 'string' || accessToken.length < 1) {
        return appendError(target, 'feishu')
    }

    const userInfoResponse = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=utf-8'
        },
        cache: 'no-store'
    })
    if (!userInfoResponse.ok) {
        return appendError(target, 'feishu')
    }
    const userInfoJson = await userInfoResponse.json()
    if (userInfoJson.code !== 0) {
        return appendError(target, 'feishu')
    }

    const feishuUser = userInfoJson.data ?? {}
    // Only accept members of the school's own Feishu tenant
    const tenantKey = process.env.FEISHU_TENANT_KEY
    if (tenantKey != null && tenantKey.length > 0) {
        if (feishuUser.tenant_key !== tenantKey) {
            return appendError(target, 'feishu')
        }
    } else {
        console.warn('FEISHU_TENANT_KEY is not set; Feishu logins are not restricted to the school tenant')
    }
    const phone = normalizeMainlandMobile(feishuUser.mobile)
    if (phone.length < 1) {
        return appendError(target, 'feishu')
    }

    let user = await prisma.user.findFirst({
        where: {
            phone
        }
    })

    if (user == null) {
        user = await prisma.user.create({
            data: {
                seiueId: await getAvailableFeishuUserId(phone),
                name: feishuUser.name ?? feishuUser.en_name ?? phone,
                schoolId: `feishu:${phone}`,
                pinyin: feishuUser.en_name ?? '',
                phone,
                adminClass0: '',
                classTeacher0: '',
                gender: Gender.others,
                lastUserAgent: head.get('User-Agent') ?? '',
                type: UserType.teacher
            }
        })
        await prisma.userAuditLog.create({
            data: {
                userId: user.seiueId,
                type: UserAuditLogType.created,
                values: [head.get('User-Agent') ?? '', ip]
            }
        })
    } else {
        await prisma.userAuditLog.create({
            data: {
                userId: user.seiueId,
                type: UserAuditLogType.logIn,
                values: [head.get('User-Agent') ?? '', ip]
            }
        })
    }

    await issueInternalLogin(user)
    return target
}

export default async function login(error: boolean | null, tok: string | null, redirectTarget: string): Promise<string> {
    const head = await headers()
    const ip = head.get('X-Forwarded-For') ?? head.get('X-Real-IP') ?? 'localhost'
    const target = safeRedirect(redirectTarget)

    if (error || typeof tok !== 'string' || tok.length < 1) {
        return appendError(target, 'seiue')
    }

    const r = await fetch('https://open.seiue.com/api/v3/oauth/me',
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${tok}`,
                'X-School-Id': '452'
            },
            cache: 'no-store'
        }
    )

    if (!r.ok) {
        return appendError(target, 'build')
    }
    const json = await r.json()
    let user = await prisma.user.findUnique({
        where: {
            seiueId: json['id']
        }
    })

    if (json['role'] === 'guardian') {
        return '/auth/parent'
    }

    const userData = {
        seiueId: json['id'],
        name: json['name'],
        schoolId: json['usin'],
        pinyin: json['pinyin'] ?? '',
        phone: json['phone'],
        adminClass0: (json['admin_classes'] == null || json['admin_classes'].length < 1) ? '' : json['admin_classes'][0],
        classTeacher0: (json['class_teachers'] == null || json['class_teachers'].length < 1) ? '' : json['class_teachers'][0],
        gender: (json['gender'] === 'm' ? Gender.male : (json['gender'] === 'f' ? Gender.female : Gender.others)),
        lastUserAgent: head.get('User-Agent') ?? '',
        type: json['role'] === 'student' ? UserType.student : UserType.teacher
    }

    if (user == null) {
        user = await prisma.user.create({
            data: userData
        })
        await prisma.userAuditLog.create({
            data: {
                userId: user.seiueId,
                type: UserAuditLogType.created,
                values: [head.get('User-Agent') ?? '', ip]
            }
        })
    } else {
        await prisma.user.update({
            data: userData,
            where: {
                seiueId: json['id']
            }
        })
        await prisma.userAuditLog.create({
            data: {
                userId: user.seiueId,
                type: UserAuditLogType.logIn,
                values: [head.get('User-Agent') ?? '', ip]
            }
        })
    }


    await issueInternalLogin(user)

    return target
}
