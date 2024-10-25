'use server'

import {Application, Authorization, PrismaClient, User} from '@prisma/client'
import {findUserOrThrow} from '@/app/lib/utils'

const prisma = new PrismaClient()

export async function getMe(): Promise<User> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: await findUserOrThrow()
        }
    }))!
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
