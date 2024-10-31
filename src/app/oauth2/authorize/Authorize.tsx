'use client'

import Error from './Error'
import { ApplicationSimple, getAppByClientID } from '@/app/lib/app-actions'
import { ApprovalStatus, Scope, User } from '@prisma/client'
import { AppIcon } from '@/app/user/applications/AppIcon'
import { getMe, getUserNameByID } from '@/app/lib/user-actions'
import { Trans } from 'react-i18next/TransWithoutContext'
import { authorizeForCode } from '@/app/lib/authorize-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

export default function Authorize({ csrfToken }: { csrfToken: string }) {
    const { t } = useTranslationClient('authorize')

    const searchParams = useSearchParams()

    if (searchParams.get('response_type') !== 'code') {
        return <Error message="errorResponseType"/>
    }

    const [ app, setApp ] = useState<ApplicationSimple | null | undefined>(undefined)
    const [ appOwner, setAppOwner ] = useState<string | null>(null)
    const [ me, setMe ] = useState<User | null | undefined>(undefined)
    const [ loading, setLoading ] = useState(false)

    useEffect(() => {
        (async () => {
            const a = await getAppByClientID(searchParams.get('client_id')!)
            setApp(a)
            if (a != null) {
                setAppOwner(await getUserNameByID(a.ownerId))
            }
            setMe(await getMe())
        })()
    }, [ searchParams ])

    if (app === undefined || me === undefined) {
        return <div className="flex justify-center items-center h-full">
            <FontAwesomeIcon icon={faSpinner} spin={true} className="secondary h-8"/>
        </div>
    }

    if (app == null || me == null) {
        return <Error message="errorApp"/>
    }

    if (app.approved !== ApprovalStatus.approved && app.ownerId !== me.seiueId) {
        return <Error message="errorApproval"/>
    }

    if (!app.redirectUrls.includes(searchParams.get('redirect_uri')!)) {
        return <Error message="errorRedirectURI"/>
    }

    const scopes = searchParams.get('scope')!.split(' ')
    for (const scope of scopes) {
        if (!app.scopes.includes(scope as keyof typeof Scope)) {
            return <Error message="errorScope"/>
        }
    }

    const stateParam = searchParams.has('state') ? `&state=${searchParams.get('state')}` : ''

    return <div className="flex justify-center items-center flex-col p-8 h-full">
        <AppIcon uploadable={false} size="big" app={app}/>
        <h1 className="m-5 text-center">{t('title')}</h1>
        <p className="mb-1 text-center"><Trans t={t} i18nKey="message" values={{ name: app.name }}
                                               components={{ 1: <b/> }}/></p>
        <p className="mb-3 text-center italic">{app.message}</p>
        <ul className="list-disc list-inside mb-3">
            {scopes.map(scope => <li key={scope}>{t(`scopeMessages.${scope}`)}</li>)}
            <li><Trans t={t} i18nKey="scopeMessages.noPassword" components={{ 1: <b/> }}/></li>
        </ul>
        <p className="text-xs secondary mb-5">
            <Trans t={t} i18nKey="appInfo" values={{ name: app.name, owner: appOwner }}
                   components={{
                       1: <a className="inline" href={app.terms!}/>,
                       2: <a className="inline" href={app.privacy!}/>
                   }}/>
        </p>

        <button onClick={async () => {
            setLoading(true)
            if (scopes.includes('sms')) {
                // Separate confirmation process for SMS
                location.href = `/oauth2/authorize/sms?client_id=${searchParams.get('client_id')!}&scope=${searchParams.get('scope')}&redirect_uri=${searchParams.get('redirect_uri')}${stateParam}&csrf=${csrfToken}`
                return
            }
            const code = await authorizeForCode(app.id, scopes.map(s => s as keyof typeof Scope), searchParams.has('state') ? searchParams.get('state') : null, searchParams.get('redirect_uri')!, csrfToken)
            if (code == null) {
                location.href = `${searchParams.get('redirect_uri')}?error=access_denied&error_description=The+authorization+request+failed${stateParam}`
            }
            location.href = `${searchParams.get('redirect_uri')}?code=${code}${stateParam}`
        }} disabled={loading} className="btn w-full mb-3">{t(loading ? 'authorizing' : 'approve')}</button>
        <a href={`${searchParams.get('redirect_uri')}?error=access_denied&error_description=The+user+denied+the+authorization+request${stateParam}`}
           className="btn-secondary w-full text-center">{t('cancel')}</a>
    </div>
}
