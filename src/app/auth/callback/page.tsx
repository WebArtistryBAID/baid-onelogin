'use client'

import {useTranslationClient} from '@/app/i18n/client'
import {useEffect} from 'react'
import {useSearchParams} from 'next/navigation'
import login from '@/app/auth/callback/login'

export default function AuthCallback() {
    const search = useSearchParams()
    const {t} = useTranslationClient('auth')

    useEffect(() => {
        const redir = search.get('redirect')
        if (location.hash == null) {
            location.href = `${redir}?error=seiue`
        }
        const match = location.hash.replace('#', '').match(/access_token=([^&]*)/)

        if (match && match[1]) {
            const token = match[1]
            login(false, token, redir!).then((url) => {
                location.href = url
            })
        }
    }, [search])

    return <div className="flex justify-center items-center h-screen">
        <p>{t('callback')}</p>
    </div>
}
