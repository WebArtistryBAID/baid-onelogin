import { useTranslation } from '@/app/i18n'
import Error from './Error'
import { getAppByClientID } from '@/app/lib/app-actions'
import { ApprovalStatus, Scope } from '@prisma/client'
import { AppIcon } from '@/app/user/applications/AppIcon'
import { getMe, getUserNameByID } from '@/app/lib/user-actions'
import { Trans } from 'react-i18next/TransWithoutContext'
import { authorizeForCode } from '@/app/lib/authorize-actions'

export default async function Authorize({ searchParams }: { searchParams: never }) {
    const { t } = await useTranslation('authorize')

    if (!('client_id' in searchParams) || !('response_type' in searchParams) || !('redirect_uri' in searchParams) || !('scope' in searchParams)) {
        return <Error message="errorParameters"/>
    }

    if (searchParams['response_type'] !== 'code') {
        return <Error message="errorResponseType"/>
    }

    const app = await getAppByClientID(searchParams['client_id'])
    if (!app) {
        return <Error message="errorApp"/>
    }

    const me = await getMe()

    if (app.approved !== ApprovalStatus.approved && app.ownerId !== me.seiueId) {
        return <Error message="errorApproval"/>
    }

    if (!app.redirectUrls.includes(searchParams['redirect_uri'])) {
        return <Error message="errorRedirectURI"/>
    }

    const scopes = (searchParams['scope'] as string).split(' ')
    for (const scope of scopes) {
        if (!app.scopes.includes(scope as keyof typeof Scope)) {
            return <Error message="errorScope"/>
        }
    }

    const stateParam = 'state' in searchParams ? `&scope=searchParams['state']` : ''

    return <div className="flex justify-center items-center flex-col p-8 h-full">
        <AppIcon uploadable={false} size="big" app={app}/>
        <h1 className="m-5">{t('title')}</h1>
        <p className="mb-1 text-center"><Trans t={t} i18nKey="message" values={{ name: app.name }}
                                               components={{ 1: <b/> }}/></p>
        <p className="mb-3 text-center italic">{app.message}</p>
        <ul className="list-disc list-inside mb-3">
            {scopes.map(scope => <li key={scope}>{t(`scopeMessages.${scope}`)}</li>)}
            <li><Trans t={t} i18nKey="scopeMessages.noPassword" components={{ 1: <b/> }}/></li>
        </ul>
        <p className="text-xs secondary mb-5">
            <Trans t={t} i18nKey="appInfo" values={{ name: app.name, owner: await getUserNameByID(app.ownerId) }}
                   components={{
                       1: <a className="inline" href={app.terms!}/>,
                       2: <a className="inline" href={app.privacy!}/>
                   }}/>
        </p>

        <button onClick={async () => {
            const code = await authorizeForCode(app.id, scopes.map(s => s as keyof typeof Scope), 'state' in searchParams ? searchParams['state'] : null, searchParams['redirect_uri'])
            if (code == null) {
                location.href = `${searchParams['redirect_uri']}?error=access_denied&error_description=The+authorization+request+failed${stateParam}`
            }
            location.href = `${searchParams['redirect_uri']}?code=${code}${stateParam}`
        }} className="btn w-full mb-3">{t('approve')}</button>
        <a href={`${searchParams['redirect_uri']}?error=access_denied&error_description=The+user+denied+the+authorization+request${stateParam}`}
           className="btn-secondary w-full text-center">{t('cancel')}</a>
    </div>
}
