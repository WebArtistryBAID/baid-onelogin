'use server'

import { Application, Authorization, Gender, PrismaClient, User, UserType } from '@prisma/client'
import { findUserOrThrow } from '@/app/lib/utils'

const prisma = new PrismaClient()

export async function getMe(): Promise<User> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: await findUserOrThrow()
        }
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

export async function getUserByID(id: number): Promise<User> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: id
        }
    }))!
}

export async function getUserSimpleByID(id: number): Promise<UserSimple> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: id
        }
    }))!
}

export async function getUserNameByID(id: number): Promise<string> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: id
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
