'use server'

import {cookies, headers} from 'next/headers'
import {SignJWT} from 'jose'
import {PrismaClient} from '@prisma/client'
import {createSecretKey} from 'node:crypto'

const prisma = new PrismaClient()
const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')

export default async function login(error: boolean | null, tok: string | null, target: string): Promise<string> {
    const head = headers()
    const ip = head.get('X-Forwarded-For') ?? head.get('X-Real-IP') ?? 'localhost'

    if (error) {
        return target + '?error=seiue'
    }

    const r = await fetch('https://open.seiue.com/api/v3/oauth/me',
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${tok}`,
                'X-School-Id': '452'
            }
        })

    if (!r.ok) {
        return target + '?error=build'
    }
    const json = await r.json()
    let user = await prisma.user.findUnique({
        where: {
            seiueId: json['id']
        }
    })

    const userData = {
        seiueId: json['id'],
        name: json['name'],
        schoolId: json['usin'],
        pinyin: json['pinyin'] ?? '',
        phone: json['phone'],
        adminClass0: (json['admin_classes'] == null || json['admin_classes'].length < 1) ? '' : json['admin_classes'][0],
        classTeacher0: (json['class_teachers'] == null || json['class_teachers'].length < 1) ? '' : json['class_teachers'][0],
        gender: (json['gender'] === 'm' ? 'male' : (json['gender'] === 'f' ? 'female' : 'others')),
        lastUserAgent: head.get('User-Agent') ?? '',
        type: json['role']
    }

    if (user == null) {
        user = await prisma.user.create({
            data: userData
        })
        await prisma.userAuditLog.create({
            data: {
                userId: user.seiueId,
                type: 'created',
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
                type: 'logIn',
                values: [head.get('User-Agent') ?? '', ip]
            }
        })
    }


    const token = await new SignJWT({
        seiueId: user.seiueId,
        name: user.name,
        pinyin: user.pinyin
    })
        .setIssuedAt()
        .setIssuer('https://beijing.academy')
        .setAudience('https://beijing.academy')
        .setExpirationTime('1 day')
        .setProtectedHeader({alg: 'HS256'})
        .sign(secret)
    cookies().set('access_token', token, {
        expires: new Date(Date.now() + 86400000)
    })

    return target as string
}