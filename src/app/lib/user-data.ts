import { prisma } from '@/app/lib/prisma'
import type { UserSimple } from '@/app/lib/user-actions'

// Server-only helpers. Do not add 'use server' here: every export of a
// 'use server' file becomes a publicly callable endpoint.

const userSimpleSelect = {
    seiueId: true,
    schoolId: true,
    createdAt: true,
    updatedAt: true,
    name: true,
    pinyin: true,
    adminClass0: true,
    classTeacher0: true,
    gender: true,
    lastUserAgent: true,
    admin: true,
    type: true
} as const

export async function getUserSimpleByID(id: number): Promise<UserSimple | null> {
    return prisma.user.findUnique({
        where: {
            seiueId: id
        },
        select: userSimpleSelect
    })
}

export async function getUserWithPhoneByID(id: number): Promise<(UserSimple & { phone: string | null }) | null> {
    return prisma.user.findUnique({
        where: {
            seiueId: id
        },
        select: {
            ...userSimpleSelect,
            phone: true
        }
    })
}
