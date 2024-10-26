'use server'

import { Application, Authorization, PrismaClient, User } from '@prisma/client'
import { findUserOrThrow } from '@/app/lib/utils'

const prisma = new PrismaClient()

export async function getMe(): Promise<User> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: await findUserOrThrow()
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
