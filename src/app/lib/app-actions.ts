'use server'

import { Application, ApprovalRequest, ApprovalStatus, Scope } from '@/generated/prisma/client'
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { findUserOrThrow } from '@/app/lib/utils'
import path from 'node:path'
import sharp from 'sharp'
import fsPromise from 'node:fs/promises'
import { getMe } from '@/app/lib/user-actions'
import { prisma } from '@/app/lib/prisma'

export interface ApplicationSimple {
    id: number
    name: string
    icon: string | null
    redirectUrls: string[]
    scopes: string[]
    clientId: string
    ownerId: number
    message: string
    approved: ApprovalStatus
    homepage: string
    terms: string | null
    privacy: string | null
    accessGated: boolean
}

export async function getApps(): Promise<ApplicationSimple[]> {
    const user = await getMe()
    return prisma.application.findMany({
        where: {
            approved: ApprovalStatus.approved,
            OR: [
                {
                    allowedUsers: {
                        hasSome: [ user.seiueId ]
                    }
                },
                {
                    accessGated: false
                },
                {
                    ownerId: user.seiueId
                }
            ]
        },
        select: {
            id: true,
            name: true,
            icon: true,
            redirectUrls: true,
            scopes: true,
            clientId: true,
            ownerId: true,
            message: true,
            approved: true,
            homepage: true,
            terms: true,
            privacy: true,
            accessGated: true
        }
    })
}

export async function getAppByClientID(clientID: string): Promise<ApplicationSimple | null> {
    const user = await getMe()
    return prisma.application.findFirst({
        where: {
            clientId: clientID,
            approved: ApprovalStatus.approved,
            OR: [
                {
                    allowedUsers: {
                        hasSome: [ user.seiueId ]
                    }
                },
                {
                    accessGated: false
                },
                {
                    ownerId: user.seiueId
                }
            ]
        },
        select: {
            id: true,
            name: true,
            icon: true,
            redirectUrls: true,
            scopes: true,
            clientId: true,
            ownerId: true,
            message: true,
            approved: true,
            homepage: true,
            terms: true,
            privacy: true,
            accessGated: true
        }
    })
}

export async function getAppByID(id: number): Promise<ApplicationSimple | null> {
    return prisma.application.findFirst({
        where: {
            id,
            approved: ApprovalStatus.approved
        },
        select: {
            id: true,
            name: true,
            icon: true,
            redirectUrls: true,
            scopes: true,
            clientId: true,
            ownerId: true,
            message: true,
            approved: true,
            homepage: true,
            terms: true,
            privacy: true,
            accessGated: true
        }
    })
}

export async function verifyAppSecretByID(id: number, secret: string): Promise<boolean> {
    const app = await prisma.application.findFirst({
        where: {
            id
        }
    })
    if (app == null || typeof secret !== 'string') {
        return false
    }
    // Compare digests so the comparison takes the same time for any input
    const expected = createHash('sha256').update(app.clientSecret).digest()
    const actual = createHash('sha256').update(secret).digest()
    return timingSafeEqual(expected, actual)
}

function isHttpURL(value: string): boolean {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
        return false
    }
}

function optionalHttpURL(value: unknown, field: string): string {
    if (typeof value !== 'string') {
        throw new Error(`Invalid ${field}`)
    }
    const trimmed = value.trim()
    if (trimmed.length > 0 && !isHttpURL(trimmed)) {
        throw new Error(`Invalid ${field}: must be an http(s) URL`)
    }
    return trimmed
}

function validRedirectURL(value: unknown): string {
    if (typeof value !== 'string' || !isHttpURL(value) || new URL(value).hash !== '') {
        throw new Error('Invalid redirect URL: must be an http(s) URL without a fragment')
    }
    return value
}

export async function createApp(formData: FormData): Promise<Application> {
    const user = await findUserOrThrow()
    const name = formData.get('name')
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > 100) {
        throw new Error('Invalid name')
    }
    const homepage = optionalHttpURL(formData.get('homepage'), 'homepage')
    const app = await prisma.application.create({
        data: {
            name: name.trim(),
            homepage,
            icon: null,
            redirectUrls: [],
            scopes: [],
            clientId: randomUUID(),
            clientSecret: randomBytes(32).toString('hex'),
            owner: {
                connect: {
                    seiueId: user
                }
            },
            message: '',
            approved: ApprovalStatus.pending,
            terms: null,
            privacy: null
        }
    })
    await prisma.appAuditLog.create({
        data: {
            type: 'created',
            application: {
                connect: {
                    id: app.id
                }
            },
            operationUser: {
                connect: {
                    seiueId: user
                }
            }
        }
    })
    return app
}

export async function getMyAppByIDSecure(id: number): Promise<Application | null> {
    const user = await getMe()
    const app = await prisma.application.findFirst({
        where: {
            id,
            ownerId: user.admin ? undefined : user.seiueId
        }
    })
    if (app != null) {
        app.clientSecret = ''
    }
    return app
}

export async function refreshAppSecret(id: number): Promise<string> {
    const user = await getMe()
    const app = await prisma.application.findFirst({
        where: {
            id,
            ownerId: user.admin ? undefined : user.seiueId
        }
    })
    if (app == null) {
        throw new Error('Application not found')
    }
    await prisma.appAuditLog.create({
        data: {
            type: 'updated',
            application: {
                connect: {
                    id: app.id
                }
            },
            operationUser: {
                connect: {
                    seiueId: user.seiueId
                }
            }
        }
    })
    const secret = randomBytes(32).toString('hex')
    await prisma.application.update({
        where: {
            id: app.id
        },
        data: {
            clientSecret: secret
        }
    })
    return secret
}

export async function getMyAppByID(id: number): Promise<Application | null> {
    const user = await getMe()
    return prisma.application.findFirst({
        where: {
            id,
            ownerId: user.admin ? undefined : user.seiueId
        }
    })
}

export async function getApprovalRequests(): Promise<ApprovalRequest[]> {
    const user = await getMe()
    if (!user.admin) {
        throw new Error('You do not have permission to view approval requests')
    }
    return prisma.approvalRequest.findMany()
}

export async function getApprovalRequestForApp(id: number): Promise<ApprovalRequest | null> {
    const app = await getMyAppByID(id)
    if (app == null) {
        throw new Error('Application not found')
    }
    return prisma.approvalRequest.findFirst({
        where: {
            applicationId: id
        }
    })
}

export async function createApprovalRequest(id: number): Promise<ApprovalRequest> {
    const app = await getMyAppByID(id)
    if (app == null || app.ownerId !== (await getMe()).seiueId) {
        throw new Error('Application not found')
    }
    if (app.approved !== ApprovalStatus.pending || app.terms == null || app.privacy == null || app.terms.length < 1 || app.privacy.length < 1 || app.message.length < 1) {
        throw new Error('Incorrect application status')
    }
    if ((await getApprovalRequestForApp(id)) != null) {
        throw new Error('Approval request already exists')
    }
    return prisma.approvalRequest.create({
        data: {
            application: {
                connect: {
                    id
                }
            }
        }
    })
}

export interface AppUpdate {
    id: number
    message: string
    homepage: string
    terms: string
    privacy: string
    redirectUrls: string[]
    scopes: Scope[]
    accessGated: boolean
    allowedUsers: number[]
}

export async function updateApp(update: AppUpdate): Promise<Application> {
    const user = await getMe()
    if (update == null || typeof update.id !== 'number') {
        throw new Error('Application not found')
    }
    const app = await prisma.application.findFirst({
        where: {
            id: update.id,
            ownerId: user.admin ? undefined : user.seiueId
        }
    })
    if (app == null) {
        throw new Error('Application not found')
    }

    // Build the update from an explicit allow-list. Passing client input to
    // Prisma directly would allow nested writes such as
    // `owner: { update: { admin: true } }`.
    if (typeof update.message !== 'string' || update.message.length > 1000) {
        throw new Error('Invalid message')
    }
    if (!Array.isArray(update.redirectUrls) || update.redirectUrls.length > 20) {
        throw new Error('Invalid redirect URLs')
    }
    if (!Array.isArray(update.scopes) || !update.scopes.every(s => (Object.values(Scope) as string[]).includes(s))) {
        throw new Error('Invalid scopes')
    }
    if (typeof update.accessGated !== 'boolean') {
        throw new Error('Invalid access gate')
    }
    if (!Array.isArray(update.allowedUsers) || !update.allowedUsers.every(u => Number.isSafeInteger(u))) {
        throw new Error('Invalid allowed users')
    }
    const data = {
        message: update.message,
        homepage: optionalHttpURL(update.homepage, 'homepage'),
        terms: optionalHttpURL(update.terms, 'terms'),
        privacy: optionalHttpURL(update.privacy, 'privacy'),
        redirectUrls: [ ...new Set(update.redirectUrls.map(validRedirectURL)) ],
        scopes: [ ...new Set(update.scopes) ],
        accessGated: update.accessGated,
        allowedUsers: [ ...new Set(update.allowedUsers) ],
        approved: ApprovalStatus.pending // Require re-approval when updating app
    }

    await prisma.appAuditLog.create({
        data: {
            type: 'updated',
            application: {
                connect: {
                    id: app.id
                }
            },
            operationUser: {
                connect: {
                    seiueId: user.seiueId
                }
            }
        }
    })
    const updated = await prisma.application.update({
        where: {
            id: app.id
        },
        data
    })
    updated.clientSecret = ''
    return updated
}

export async function setAppApprovalStatus(id: number, approved: ApprovalStatus): Promise<Application> {
    const user = await getMe()
    if (!user.admin) {
        throw new Error('You do not have permission to approve applications')
    }
    const app = await prisma.application.findFirst({
        where: {
            id
        }
    })
    if (app == null) {
        throw new Error('Application not found')
    }
    await prisma.appAuditLog.create({
        data: {
            type: 'updated',
            application: {
                connect: {
                    id: app.id
                }
            },
            operationUser: {
                connect: {
                    seiueId: user.seiueId
                }
            }
        }
    })
    await prisma.approvalRequest.deleteMany({
        where: {
            applicationId: app.id
        }
    })
    return prisma.application.update({
        where: {
            id: app.id
        },
        data: {
            approved
        }
    })
}

export async function deleteApp(id: number): Promise<void> {
    const user = await getMe()
    const app = await prisma.application.findFirst({
        where: {
            id,
            ownerId: user.admin ? undefined : user.seiueId
        }
    })
    if (app == null) {
        throw new Error('Application not found')
    }
    await prisma.application.delete({
        where: {
            id
        }
    })
}

export async function uploadAppIcon(formData: FormData): Promise<Application> {
    const user = await getMe()
    const app = await prisma.application.findFirst({
        where: {
            id: parseInt(formData.get('id') as string),
            ownerId: user.admin ? undefined : user.seiueId
        }
    })
    if (app == null) {
        throw new Error('Application not found')
    }
    const file = formData.get('icon')
    if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) {
        throw new Error('Invalid icon')
    }
    const root = process.env.UPLOAD_ROOT

    await fsPromise.mkdir(path.join(root!, 'app-icons'), {recursive: true})

    if (app.icon != null) {
        await fsPromise.rm(path.join(root!, app.icon!))
    }
    const fn = `${app.id}-${randomUUID().toString()}.webp`
    await sharp(Buffer.from(await file.arrayBuffer()))
        .resize({
            width: 512,
            height: 512
        })
        .webp({
            quality: 90
        })
        .toFile(path.join(root!, 'app-icons', fn))
    await prisma.appAuditLog.create({
        data: {
            type: 'updated',
            application: {
                connect: {
                    id: app.id
                }
            },
            operationUser: {
                connect: {
                    seiueId: user.seiueId
                }
            }
        }
    })
    return prisma.application.update({
        where: {
            id: app.id
        },
        data: {
            icon: `/app-icons/${fn}`
        }
    })
}
