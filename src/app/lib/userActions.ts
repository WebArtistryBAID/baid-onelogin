'use server'

import { PrismaClient, User } from '@prisma/client'
import { findUserOrThrow } from '@/app/lib/utils'

const prisma = new PrismaClient()

export async function getMe(): Promise<User> {
    return (await prisma.user.findUnique({
        where: {
            seiueId: await findUserOrThrow()
        }
    }))!
}
