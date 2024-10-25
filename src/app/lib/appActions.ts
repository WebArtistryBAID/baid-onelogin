'use server'

import {Application, PrismaClient} from '@prisma/client'
import {randomBytes, randomUUID} from 'node:crypto'
import {findUserOrThrow} from '@/app/lib/utils'
import path from 'node:path'
import sharp from 'sharp'
import fsPromise from 'node:fs/promises'

const prisma = new PrismaClient()

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
            approved: false,
            terms: null,
            privacy: null
        }
    })
    prisma.appAuditLog.create({
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
    const app = await prisma.application.findFirst({
        where: {
            id,
            ownerId: await findUserOrThrow()
        }
    })
    app!.clientSecret = ''
    return app
}

export async function refreshAppSecret(id: number): Promise<string> {
    const app = await prisma.application.findFirst({
        where: {
            id,
            ownerId: await findUserOrThrow()
        }
    })
    if (app == null) {
        throw new Error('Application not found')
    }
    prisma.appAuditLog.create({
        data: {
            type: 'updated',
            application: {
                connect: {
                    id: app.id
                }
            },
            operationUser: {
                connect: {
                    seiueId: await findUserOrThrow()
                }
            }
        }
    })
    const secret = randomBytes(32).toString('hex')
    prisma.application.update({
        where: {
            id: app.id
        },
        data: {
            clientSecret: secret
        }
    })
    return randomBytes(32).toString('hex')
}

export async function getMyAppByID(id: number): Promise<Application | null> {
    return prisma.application.findFirst({
        where: {
            id,
            ownerId: await findUserOrThrow()
        }
    })
}

export async function uploadAppIcon(formData: FormData): Promise<Application> {
    const app = await prisma.application.findFirst({
        where: {
            id: parseInt(formData.get('id') as string),
            ownerId: await findUserOrThrow()
        }
    })
    if (app == null) {
        throw new Error('Application not found')
    }
    const file = formData.get('icon') as File
    const root = process.env.UPLOAD_ROOT

    await fsPromise.mkdir(path.join(root!, 'app-icons'), {recursive: true})

    await fsPromise.rm(path.join(root!, app.icon!))
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
    return prisma.application.update({
        where: {
            id: app.id
        },
        data: {
            icon: `/app-icons/${fn}`
        }
    })
}
