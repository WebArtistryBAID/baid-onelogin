'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { ApplicationSimple, getAppByClientID } from '@/app/lib/app-actions'
import { Scope, User } from '@prisma/client'
import { getMe } from '@/app/lib/user-actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import Error from '@/app/oauth2/authorize/Error'
import { AppIcon } from '@/app/user/applications/AppIcon'
import PhoneInput from 'react-phone-number-input/input-mobile'
import { E164Number } from 'libphonenumber-js'
import { sendVerificationCode } from '@/app/lib/sms-actions'
import If from '@/app/lib/If'

export default function BindPhoneNumber() {
    const { t } = useTranslationClient('authorize')

    const searchParams = useSearchParams()

    const stateParam = searchParams.has('state') ? `&state=${searchParams.get('state')}` : ''
    const [ app, setApp ] = useState<ApplicationSimple | null | undefined>(undefined)
    const [ me, setMe ] = useState<User | null | undefined>(undefined)
    const [ loading, setLoading ] = useState(false)
    const [ smsSent, setSmsSent ] = useState(false)
    const [ sendError, setSendError ] = useState(false)
    const [ phone, setPhone ] = useState<E164Number | undefined>()

    const ref1 = useRef<HTMLInputElement>(null)
    const ref2 = useRef<HTMLInputElement>(null)
    const ref3 = useRef<HTMLInputElement>(null)
    const ref4 = useRef<HTMLInputElement>(null)
    const ref5 = useRef<HTMLInputElement>(null)
    const ref6 = useRef<HTMLInputElement>(null)
    const [ value1, setValue1 ] = useState('')
    const [ value2, setValue2 ] = useState('')
    const [ value3, setValue3 ] = useState('')
    const [ value4, setValue4 ] = useState('')
    const [ value5, setValue5 ] = useState('')
    const [ value6, setValue6 ] = useState('')

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

    if (smsSent) {
        return <div className="flex justify-center items-center flex-col p-8 h-full">
            <AppIcon uploadable={false} size="big" app={app}/>
            <h1 className="m-5 text-center">{t('sms.title')}</h1>
            <p className="mb-3 text-center">{t('sms.sent')}</p>

            <div className="mb-5 flex">
                <input autoFocus={true} ref={ref1} value={value1} onChange={e => {
                    setValue1(e.currentTarget.value.charAt(0))
                    if (e.currentTarget.value.charAt(0) !== '') {
                        ref2.current?.focus()
                        ref2.current?.setSelectionRange(0, 1)
                    }
                }} onKeyDown={e => {
                    if (e.key === 'ArrowRight') {
                        ref2.current?.focus()
                        ref2.current?.setSelectionRange(0, 1)
                    }
                }}
                       className="sms mr-3" type="text"/>
                <input ref={ref2} value={value2} onChange={e => {
                    setValue2(e.currentTarget.value.charAt(0))
                    if (e.currentTarget.value.charAt(0) !== '') {
                        ref3.current?.focus()
                        ref3.current?.setSelectionRange(0, 1)
                    } else {
                        ref1.current?.focus()
                        ref1.current?.setSelectionRange(0, 1)
                    }
                }} onKeyDown={e => {
                    if (e.key === 'ArrowRight') {
                        ref3.current?.focus()
                        ref3.current?.setSelectionRange(0, 1)
                    }
                    if (e.key === 'ArrowLeft') {
                        ref1.current?.focus()
                        ref1.current?.setSelectionRange(0, 1)
                    }
                    if ((e.key === 'Delete' || e.key === 'Backspace') && e.currentTarget.value === '') {
                        setValue1('')
                        ref1.current?.focus()
                        ref1.current?.setSelectionRange(0, 1)
                    }
                }}
                       className="sms mr-3" type="text"/>
                <input ref={ref3} value={value3} onChange={e => {
                    setValue3(e.currentTarget.value.charAt(0))
                    if (e.currentTarget.value.charAt(0) !== '') {
                        ref4.current?.focus()
                        ref4.current?.setSelectionRange(0, 1)
                    } else {
                        ref2.current?.focus()
                        ref2.current?.setSelectionRange(0, 1)
                    }
                }} onKeyDown={e => {
                    if (e.key === 'ArrowRight') {
                        ref4.current?.focus()
                        ref4.current?.setSelectionRange(0, 1)
                    }
                    if (e.key === 'ArrowLeft') {
                        ref2.current?.focus()
                        ref2.current?.setSelectionRange(0, 1)
                    }
                    if ((e.key === 'Delete' || e.key === 'Backspace') && e.currentTarget.value === '') {
                        setValue2('')
                        ref2.current?.focus()
                        ref2.current?.setSelectionRange(0, 1)
                    }
                }}
                       className="sms mr-3" type="text"/>
                <input ref={ref4} value={value4} onChange={e => {
                    setValue4(e.currentTarget.value.charAt(0))
                    if (e.currentTarget.value.charAt(0) !== '') {
                        ref5.current?.focus()
                        ref5.current?.setSelectionRange(0, 1)
                    } else {
                        ref3.current?.focus()
                        ref3.current?.setSelectionRange(0, 1)
                    }
                }} onKeyDown={e => {
                    if (e.key === 'ArrowRight') {
                        ref5.current?.focus()
                        ref5.current?.setSelectionRange(0, 1)
                    }
                    if (e.key === 'ArrowLeft') {
                        ref3.current?.focus()
                        ref3.current?.setSelectionRange(0, 1)
                    }
                    if ((e.key === 'Delete' || e.key === 'Backspace') && e.currentTarget.value === '') {
                        setValue3('')
                        ref3.current?.focus()
                        ref3.current?.setSelectionRange(0, 1)
                    }
                }}
                       className="sms mr-3" type="text"/>
                <input ref={ref5} value={value5} onChange={e => {
                    setValue5(e.currentTarget.value.charAt(0))
                    if (e.currentTarget.value.charAt(0) !== '') {
                        ref6.current?.focus()
                        ref6.current?.setSelectionRange(0, 1)
                    } else {
                        ref4.current?.focus()
                        ref4.current?.setSelectionRange(0, 1)
                    }
                }} onKeyDown={e => {
                    if (e.key === 'ArrowRight') {
                        ref6.current?.focus()
                        ref6.current?.setSelectionRange(0, 1)
                    }
                    if (e.key === 'ArrowLeft') {
                        ref4.current?.focus()
                        ref4.current?.setSelectionRange(0, 1)
                    }
                    if ((e.key === 'Delete' || e.key === 'Backspace') && e.currentTarget.value === '') {
                        setValue4('')
                        ref4.current?.focus()
                        ref4.current?.setSelectionRange(0, 1)
                    }
                }}
                       className="sms mr-3" type="text"/>
                <input ref={ref6} value={value6} onChange={e => {
                    setValue6(e.currentTarget.value.charAt(0))
                    if (e.currentTarget.value.charAt(0) === '') {
                        ref5.current?.focus()
                        ref5.current?.setSelectionRange(0, 1)
                    }
                }} onKeyDown={e => {
                    if (e.key === 'ArrowLeft') {
                        ref5.current?.focus()
                    }
                    if ((e.key === 'Delete' || e.key === 'Backspace') && e.currentTarget.value === '') {
                        setValue5('')
                        ref5.current?.focus()
                        ref5.current?.setSelectionRange(0, 1)
                    }
                }}
                       className="sms" type="text"/>
            </div>

            <button className="w-full mb-3 btn">{t('sms.continue')}</button>
            <button className="w-full mb-3 btn-secondary" onClick={() => setSmsSent(false)}>{t('back')}</button>
        </div>
    }

    return <div className="flex justify-center items-center flex-col p-8 h-full">
        <AppIcon uploadable={false} size="big" app={app}/>
        <h1 className="m-5 text-center">{t('sms.title')}</h1>
        <p className="mb-3 text-center">{t('sms.enterPhoneNumber')}</p>
        <div className="w-full flex items-center mb-3">
            <p className="flex-shrink mr-3">{t('sms.china')}</p>
            <PhoneInput onChange={setPhone} country="CN" value={phone}
                        inputComponent={React.forwardRef((props, ref) => <input {...props} ref={ref}
                                                                                className="text flex-grow"
                                                                                placeholder={t('sms.phoneNumber')}
                                                                                autoFocus={true}/>)}/>
        </div>
        <If condition={sendError}>
            <p className="text-red-500 text-center mb-3">{t('sms.verifyError')}</p>
        </If>
        <p className="secondary text-xs text-center mb-5">{t('sms.standardRates')}</p>
        <button className="w-full mb-3 btn" disabled={loading} onClick={async () => {
            setLoading(true)
            if (await sendVerificationCode(phone!)) {
                setSmsSent(true)
            } else {
                setSendError(true)
            }
            setLoading(false)
        }}>{t('sms.sendVerificationCode')}</button>
        <a href={`/oauth2/authorize/sms?client_id=${searchParams.get('client_id')!}&scope=${searchParams.get('scope')}&redirect_uri=${searchParams.get('redirect_uri')}${stateParam}&csrf=${searchParams.get('csrf')!}`}
           className="text-center w-full btn-secondary">{t('back')}</a>
    </div>
}
