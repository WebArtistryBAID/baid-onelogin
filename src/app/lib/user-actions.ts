'use server'

import { Application, Authorization, Gender, User, UserType } from '@/generated/prisma/client'
import { findUserOrThrow } from '@/app/lib/utils'
import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'

// Fields that must never leave the server, even to the user themselves
const privateUserFields = {
    accessToken: true,
    lastSMSCode: true,
    lastSMSPhone: true,
    lastSMSVerify: true,
    lastSendSMS: true
} as const

export type SafeUser = Omit<User, keyof typeof privateUserFields>

export async function getMe(): Promise<SafeUser> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: await findUserOrThrow()
        },
        omit: privateUserFields
    }))!
}

export interface UserSimple {
    seiueId: number
    schoolId: string
    createdAt: Date
    updatedAt: Date
    name: string
    pinyin: string
    adminClass0: string | null
    classTeacher0: string | null
    gender: Gender
    lastUserAgent: string
    admin: boolean
    type: UserType
}

export async function getUserNameByID(id: number): Promise<string> {
    await findUserOrThrow()
    return (await prisma.user.findUnique({
        where: {
            seiueId: id
        },
        select: {
            name: true
        }
    }))!.name
}

export async function getMyAuths(): Promise<Authorization[]> {
    return (await prisma.authorization.findMany({
        where: {
            userId: await findUserOrThrow()
        }
    }))
}

export async function getMyAuthByID(id: number): Promise<Authorization> {
    return (await prisma.authorization.findUnique({
        where: {
            id,
            userId: await findUserOrThrow()
        }
    }))!
}

export async function getMyAuthByApp(appId: number): Promise<Authorization | null> {
    return (await prisma.authorization.findFirst({
        where: {
            userId: await findUserOrThrow(),
            applicationId: appId
        }
    }))!
}

export async function getMyApps(): Promise<Application[]> {
    return (await prisma.application.findMany({
        where: {
            ownerId: await findUserOrThrow()
        }
    }))
}

export async function getMyAppsSecure(): Promise<Application[]> {
    return (await prisma.application.findMany({
        where: {
            ownerId: await findUserOrThrow()
        }
    })).map(app => {
        app.clientSecret = ''
        return app
    })
}

export async function logOut(): Promise<void> {
    const c = await cookies()
    c.delete('access_token')
}
