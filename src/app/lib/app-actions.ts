'use server'

import {Application, ApprovalRequest, ApprovalStatus, PrismaClient} from '@prisma/client'
import {randomBytes, randomUUID} from 'node:crypto'
import {findUserOrThrow} from '@/app/lib/utils'
import path from 'node:path'
import sharp from 'sharp'
import fsPromise from 'node:fs/promises'
import {getMe} from '@/app/lib/user-actions'

const prisma = new PrismaClient()

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
    terms: string | null
    privacy: string | null
}

export async function getAppByClientID(clientID: string): Promise<ApplicationSimple | null> {
    return prisma.application.findFirst({
        where: {
            clientId: clientID
        }
    })
}

export async function getAppByID(id: number): Promise<ApplicationSimple | null> {
    return prisma.application.findFirst({
        where: {
            id
        }
    })
}

export async function verifyAppSecretByID(id: number, secret: string): Promise<boolean> {
    const app = await prisma.application.findFirst({
        where: {
            id
        }
    })
    return app != null && app.clientSecret === secret
}

export async function createApp(formData: FormData): Promise<Application> {
    const user = await findUserOrThrow()
    const app = await prisma.application.create({
        data: {
            name: formData.get('name') as string,
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
    app!.clientSecret = ''
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
    const app = getMyAppByID(id)
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

export async function updateApp(data: Partial<Application>): Promise<Application> {
    const user = await getMe()
    const app = await prisma.application.findFirst({
        where: {
            id: data.id!,
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
    if (data.clientSecret != null || data.icon != null || data.clientId != null || data.approved != null ||
        data.createdAt != null || data.updatedAt != null || data.ownerId != null || data.name != null) {
        throw new Error('Invalid update for certain fields')
    }
    data.approved = ApprovalStatus.pending // Require re-approval when updating app
    return prisma.application.update({
        where: {
            id: app.id
        },
        data
    })
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
    const file = formData.get('icon') as File
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
