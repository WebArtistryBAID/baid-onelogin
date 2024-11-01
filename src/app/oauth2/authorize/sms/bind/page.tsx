'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { ApplicationSimple, getAppByClientID } from '@/app/lib/app-actions'
import { Scope, User } from '@prisma/client'
import { getMe } from '@/app/lib/user-actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import Error from '@/app/oauth2/authorize/Error'
import { AppIcon } from '@/app/user/applications/AppIcon'
import PhoneInput from 'react-phone-number-input/input-mobile'
import { E164Number } from 'libphonenumber-js'
import { authorizeSMSForCode, sendVerificationCode } from '@/app/lib/sms-actions'
import If from '@/app/lib/If'
import { useInterval } from 'react-interval-hook'

export default function BindPhoneNumber() {
    const { t } = useTranslationClient('authorize')

    const searchParams = useSearchParams()

    const stateParam = searchParams.has('state') ? `&state=${searchParams.get('state')}` : ''
    const [ app, setApp ] = useState<ApplicationSimple | null | undefined>(undefined)
    const [ me, setMe ] = useState<User | null | undefined>(undefined)
    const [ loading, setLoading ] = useState(false)
    const [ smsSent, setSmsSent ] = useState(false)
    const [ codeError, setCodeError ] = useState(false)
    const [ sendError, setSendError ] = useState(false)
    const [ phone, setPhone ] = useState<E164Number | undefined>()

    const [ value, setValue ] = useState('')

    const [ retryTimeLeft, setRetryTimeLeft ] = useState(0)

    useEffect(() => {
        (async () => {
            const a = await getAppByClientID(searchParams.get('client_id')!)
            setApp(a)
            setMe(await getMe())
        })()
    }, [ searchParams ])

    useInterval(() => {
        if (retryTimeLeft > 0) {
            setRetryTimeLeft(retryTimeLeft - 1)
        }
    })

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

    if (smsSent) {
        return <div className="flex justify-center items-center flex-col p-8 h-full">
            <AppIcon uploadable={false} size="big" app={app}/>
            <h1 className="m-5 text-center">{t('sms.title')}</h1>
            <p className="mb-3 text-center">{t('sms.sent')}</p>

            <div className="mb-5 w-full">
                <input autoFocus={true} value={value} maxLength={6} onChange={e => {
                    setValue(e.currentTarget.value)
                }} className="text text-center text-xl w-full" type="text"/>
            </div>

            <If condition={codeError}>
                <p className="text-red-500 text-center mb-5">
                    {t('sms.codeError')}
                </p>
            </If>

            <button className="w-full mb-3 btn" onClick={async () => {
                setLoading(true)
                const code = await authorizeSMSForCode(value,
                    app.id, scopes.map(s => s as keyof typeof Scope),
                    searchParams.has('state') ? searchParams.get('state') : null,
                    searchParams.get('redirect_uri')!, searchParams.get('csrf')!)
                if (code == null) {
                    setCodeError(true)
                    return
                }
                location.href = `${searchParams.get('redirect_uri')}?code=${code}${stateParam}`
            }}>{t('sms.continue')}</button>
            <button className="w-full mb-3 btn-secondary" onClick={() => {
                setSmsSent(false)
                setSendError(false)
            }}>{t('back')}</button>
        </div>
    }

    return <div className="flex justify-center items-center flex-col p-8 h-full">
        <AppIcon uploadable={false} size="big" app={app}/>
        <h1 className="m-5 text-center">{t('sms.title')}</h1>
        <p className="mb-3 text-center">{t('sms.enterPhoneNumber')}</p>
        <div className="w-full flex items-center mb-3">
            <p className="w-1/5 mr-3 hidden lg:block text-center">{t('sms.china')}</p>
            <p className="w-1/5 lg:hidden text-center mr-3">+86</p>
            <PhoneInput onChange={setPhone} country="CN" value={phone}
                        inputComponent={React.forwardRef((props, ref) => <input {...props} ref={ref}
                                                                                className="text w-4/5" autoFocus={true}
                                                                                placeholder={t('sms.phoneNumber')}/>)}/>
        </div>
        <If condition={sendError}>
            <p className="text-red-500 text-center mb-3">{t('sms.verifyError')}</p>
        </If>
        <p className="secondary text-xs text-center mb-5">{t('sms.standardRates')}</p>
        <button className="w-full mb-3 btn" disabled={loading || retryTimeLeft > 0} onClick={async () => {
            setLoading(true)
            if (await sendVerificationCode(phone!)) {
                setCodeError(false)
                setRetryTimeLeft(90)
                setSmsSent(true)
            } else {
                setSendError(true)
            }
            setLoading(false)
        }}>{retryTimeLeft < 1 ? t('sms.sendVerificationCode') : t('sms.retry', { time: retryTimeLeft })}</button>
        <a href={`/oauth2/authorize/sms?client_id=${searchParams.get('client_id')!}&scope=${searchParams.get('scope')}&redirect_uri=${searchParams.get('redirect_uri')}${stateParam}&csrf=${searchParams.get('csrf')!}`}
           className="text-center w-full btn-secondary">{t('back')}</a>
    </div>
}
