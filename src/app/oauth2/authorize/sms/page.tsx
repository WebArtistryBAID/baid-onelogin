'use client'

import { AppIcon } from '@/app/user/applications/AppIcon'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ApplicationSimple, getAppByClientID } from '@/app/lib/app-actions'
import { Scope, User } from '@prisma/client'
import { getMe } from '@/app/lib/user-actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import Error from '@/app/oauth2/authorize/Error'
import { useTranslationClient } from '@/app/i18n/client'
import { parsePhoneNumber } from 'libphonenumber-js'
import { authorizeForCode } from '@/app/lib/authorize-actions'

export default function SMSAuthorization() {
    // The app will not be able to send SMS notifications if this step is not completed
    const { t } = useTranslationClient('authorize')

    const searchParams = useSearchParams()

    const stateParam = searchParams.has('state') ? `&state=${searchParams.get('state')}` : ''
    const [ app, setApp ] = useState<ApplicationSimple | null | undefined>(undefined)
    const [ me, setMe ] = useState<User | null | undefined>(undefined)
    const [ loading, setLoading ] = useState(false)

    useEffect(() => {
        (async () => {
            const a = await getAppByClientID(searchParams.get('client_id')!)
            setApp(a)
            setMe(await getMe())
        })()
    }, [ searchParams ])

    if (app === undefined || me === undefined) {
        return <div className="flex justify-center items-center h-full">
            <FontAwesomeIcon icon={faSpinner} spin={true} className="secondary h-8"/>
        </div>
    }

    if (app === null || me === null) {
        return <Error message="errorApp"/>
    }

    const scopes = searchParams.get('scope')!.split(' ')
    for (const scope of scopes) {
        if (!app.scopes.includes(scope as keyof typeof Scope)) {
            return <Error message="errorScope"/>
        }
    }

    const phone = me.phone == null ? null : `+86${me.phone}` // We only support mainland China mobile numbers

    if (phone == null) {
        return <div className="flex justify-center items-center flex-col p-8 h-full">
            <AppIcon uploadable={false} size="big" app={app}/>
            <h1 className="m-5 text-center">{t('sms.title')}</h1>
            <p className="mb-1 text-center">{t('sms.noPhoneNumber')}</p>
            <p className="secondary text-xs text-center mb-5">{t('sms.standardRates')}</p>
            <button disabled={loading} onClick={() => {
                location.href = `/oauth2/authorize/sms/bind?client_id=${searchParams.get('client_id')!}&scope=${searchParams.get('scope')}&redirect_uri=${searchParams.get('redirect_uri')}${stateParam}&csrf=${searchParams.get('csrf')}`
            }} className="btn w-full mb-3">{t('sms.addPhoneNumber')}</button>
            <button disabled={loading} onClick={async () => {
                setLoading(true)
                const code = await authorizeForCode(app.id, scopes.map(s => s as keyof typeof Scope), searchParams.has('state') ? searchParams.get('state') : null, searchParams.get('redirect_uri')!, searchParams.get('csrf')!)
                if (code == null) {
                    location.href = `${searchParams.get('redirect_uri')}?error=access_denied&error_description=The+authorization+request+failed${stateParam}`
                }
                location.href = `${searchParams.get('redirect_uri')}?code=${code}${stateParam}`
            }} className="btn-secondary w-full text-center">{t('sms.continueWithoutNotifications')}</button>
        </div>
    }

    return <div className="flex justify-center items-center flex-col p-8 h-full">
        <AppIcon uploadable={false} size="big" app={app}/>
        <h1 className="m-5 text-center">{t('sms.title')}</h1>
        <p className="mb-3 text-center">{t('sms.confirmPhoneNumber')}</p>
        <p className="mb-5 text-center text-xl font-bold">{parsePhoneNumber(phone).formatInternational()}</p>
        <button disabled={loading} onClick={async () => {
            setLoading(true)
            const code = await authorizeForCode(app.id, scopes.map(s => s as keyof typeof Scope), searchParams.has('state') ? searchParams.get('state') : null, searchParams.get('redirect_uri')!, searchParams.get('csrf')!)
            if (code == null) {
                location.href = `${searchParams.get('redirect_uri')}?error=access_denied&error_description=The+authorization+request+failed${stateParam}`
            }
            location.href = `${searchParams.get('redirect_uri')}?code=${code}${stateParam}`
        }} className="btn w-full mb-3">{t('sms.continue')}</button>
        <button disabled={loading} onClick={() => {
            location.href = `/oauth2/authorize/sms/bind?client_id=${searchParams.get('client_id')!}&scope=${searchParams.get('scope')}&redirect_uri=${searchParams.get('redirect_uri')}${stateParam}&csrf=${searchParams.get('csrf')}`
        }} className="btn w-full mb-3">{t('sms.useOtherNumber')}</button>
        <button disabled={loading} onClick={async () => {
            setLoading(true)
            const code = await authorizeForCode(app.id, scopes.map(s => s as keyof typeof Scope), searchParams.has('state') ? searchParams.get('state') : null, searchParams.get('redirect_uri')!, searchParams.get('csrf')!)
            if (code == null) {
                location.href = `${searchParams.get('redirect_uri')}?error=access_denied&error_description=The+authorization+request+failed${stateParam}`
            }
            location.href = `${searchParams.get('redirect_uri')}?code=${code}${stateParam}`
        }} className="btn-secondary w-full text-center">{t('sms.continueWithoutNotifications')}</button>
    </div>
}