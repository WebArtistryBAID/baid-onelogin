'use client'

import {redirect} from 'next/navigation'
import {getMyAppByIDSecure, refreshAppSecret} from '@/app/lib/appActions'
import {AppIcon} from '@/app/user/applications/AppIcon'
import {getUserNameByID} from '@/app/lib/userActions'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCopy} from '@fortawesome/free-regular-svg-icons'
import {useTranslationClient} from '@/app/i18n/client'
import {useEffect, useState} from 'react'
import {Application} from '@prisma/client'
import {faRefresh} from '@fortawesome/free-solid-svg-icons'

export default function ApplicationView({searchParams}: { searchParams: never }) {
    const {t} = useTranslationClient('applications')
    const [copiedHighlight, setCopiedHighlight] = useState(false)
    const [copiedHighlightSecret, setCopiedHighlightSecret] = useState(false)
    const [app, setApp] = useState<Application | null>(null)
    const [ownerName, setOwnerName] = useState('')
    const [secret, setSecret] = useState<string | null>('secret' in searchParams ? searchParams['secret'] : null)

    const [message, setMessage] = useState('')

    if (!('app' in searchParams)) {
        redirect('/user/applications')
    }

    useEffect(() => {
        (async () => {
            const a = await getMyAppByIDSecure(parseInt(searchParams['app']))
            if (a == null) {
                location.href = '/user/applications'
                return
            }
            getUserNameByID(a.ownerId).then(setOwnerName)
            setMessage(a.message)
            setApp(a!)
        })()
    }, [searchParams])

    if (app == null) {
        return <div>
            <h1 className="mb-5">{t('view.title')}</h1>
            <div className="rounded-3xl bg-secondary w-1/2 h-8 mb-2"></div>
            <div className="rounded-3xl bg-secondary w-full h-8 mb-2"></div>
            <div className="rounded-3xl bg-secondary w-full h-8 mb-5"></div>
            <div className="rounded-3xl bg-secondary w-2/3 h-8 mb-2"></div>
            <div className="rounded-3xl bg-secondary w-full h-8 mb-2"></div>
            <div className="rounded-3xl bg-secondary w-full h-8 mb-2"></div>
        </div>
    }

    return <div className="h-full overflow-y-auto">
        <h1 className="mb-5">{t('view.title')}</h1>

        <div
            className="flex flex-col lg:flex-row w-full lg:justify-start lg:text-left text-center justify-center items-center mb-5">
            <div className="mb-3 lg:mb-0 lg:mr-3">
                <AppIcon uploadable={true} app={app} size="big"/>
            </div>
            <div>
                <p className="text-xl font-bold font-display">{app.name}</p>
                <p className="text-sm">{t('view.oauth')}</p>
            </div>
        </div>

        <p className="text-sm secondary">{t('view.owner')}</p>
        <p className="text-xl mb-3">{ownerName}</p>

        <p className="text-sm secondary">{t('view.approval')}</p>
        <p className="text-xl mb-1">{app.approved ?
            <span className="text-green-500">{t('view.approved')}</span> : t('view.pending')}</p>
        {!app.approved ? <button className="btn mb-1">{t('view.requestApproval')}</button> : null}
        <p className="text-xs secondary mb-3">{t('view.approvalInfo')}</p>

        <p className="text-sm secondary mb-1">{t('view.clientId')}</p>
        <pre className="rounded-3xl bg-secondary p-3 mb-3 relative w-full overflow-x-auto">
            {app!.clientId}

            <button className="absolute right-3 top-2 icon-btn h-8 w-8"
                    onClick={() => {
                        navigator.clipboard.writeText(app.clientId)
                        setCopiedHighlight(true)
                        setTimeout(() => setCopiedHighlight(false), 1000)
                    }}>
                <FontAwesomeIcon icon={faCopy}
                                 className={`${copiedHighlight ? 'text-green-400' : ''} transition-colors duration-100`}/>
            </button>
        </pre>

        <p className="text-sm secondary mb-1">{t('view.clientSecret')}</p>
        {secret != null
            ? <pre className="rounded-3xl bg-secondary p-3 mb-1 relative w-full overflow-x-auto">
                {secret}

                <button className="absolute right-3 top-2 icon-btn h-8 w-8"
                        onClick={() => {
                            void navigator.clipboard.writeText(app.clientId)
                            setCopiedHighlightSecret(true)
                            setTimeout(() => setCopiedHighlightSecret(false), 1000)
                        }}>
                    <FontAwesomeIcon icon={faCopy} aria-label={t('view.copy')}
                                     className={`${copiedHighlightSecret ? 'text-green-400' : ''} transition-colors duration-100`}/>
                </button>
            </pre>
            : <pre className="rounded-3xl bg-secondary p-3 mb-1 relative w-full overflow-x-auto">
                *******

                <button className="absolute right-3 top-2 icon-btn h-8 w-8"
                        onClick={async () => {
                            setSecret(await refreshAppSecret(app.id))
                        }}>
                    <FontAwesomeIcon icon={faRefresh} aria-label={t('view.refresh')}/>
                </button>
            </pre>}
        <p className="text-xs secondary mb-3">{t('view.clientSecretOnce')}</p>

        <p className="text-sm secondary mb-1">{t('view.message')}</p>
        <input className="text mb-1 w-full" placeholder={t('view.message')} type="text"
               onChange={(e) => setMessage(e.currentTarget.value)} value={message}/>
        <p className="text-xs secondary mb-3">{t('view.messageInfo')}</p>


        <p className="text-sm secondary mb-1">{t('view.authorization')}</p>
        <button className="btn mb-3">{t('view.viewAuthorizations')}</button>
        <p className="text-sm secondary mb-1">{t('view.auditLogs')}</p>
        <button className="btn mb-3">{t('view.viewAuditLogs')}</button>
        <p className="text-sm secondary mb-1">{t('view.others')}</p>
        <button className="btn-danger mb-3">{t('view.delete')}</button>
    </div>
}