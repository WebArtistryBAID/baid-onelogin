'use client'

import Link from 'next/link'
import React, {Suspense, useState} from 'react'
import {useTranslationClient} from '@/app/i18n/client'
import {useSearchParams} from 'next/navigation'
import {loginWithAccessCode} from '@/app/auth/callback/login'
import If from '@/app/lib/If'

function Sub() {
    const {t} = useTranslationClient('auth')
    const search = useSearchParams()
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const redirect = search.has('redirect') ? search.get('redirect')! : '/'

    return <div className="simple-container flex flex-col justify-center items-center">
        <h1 className="mb-1 text-center">{t('accessCode')}</h1>
        <p className="text-center text-sm mb-5">{t('accessCodeDescription')}</p>
        <input className="text w-full mb-3" type="text" autoFocus={true}
               placeholder={t('accessCode')} value={value}
               onChange={e => {
                   setValue(e.currentTarget.value)
                   setError(false)
               }}/>
        <If condition={error}>
            <p className="text-red-500 mb-3">{t('accessCodeError')}</p>
        </If>
        <button onClick={async () => {
            if (value.length < 1) {
                return
            }
            setLoading(true)
            if (await loginWithAccessCode(value)) {
                location.href = redirect
            } else {
                setError(true)
            }
            setLoading(false)
        }} disabled={loading} className="mb-3 w-full btn block text-center">{t('loginAccessCode')}</button>
        <Link href="/auth" className="mb-3 w-full btn-secondary block text-center">{t('back')}</Link>
    </div>
}

export default function AccessCodePage() {
    return <Suspense><Sub/></Suspense>
}
