'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import login from '@/app/auth/callback/login'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import { appendQuery, safeRedirect } from '@/app/lib/safe-redirect'

function Sub() {
    const search = useSearchParams()
    const router = useRouter()
    const {t} = useTranslationClient('auth')

    useEffect(() => {
        const redir = safeRedirect(search.get('redirect'))
        const match = location.hash.replace('#', '').match(/access_token=([^&]*)/)

        if (match && match[1]) {
            const token = match[1]
            login(false, token, redir).then(url => {
                router.push(safeRedirect(url))
            })
        } else {
            router.push(appendQuery(redir, { error: 'seiue' }))
        }
    }, [router, search])

    return <div className="flex justify-center items-center h-screen">
        <p>{t('callback')}</p>
    </div>
}

export default function AuthCallback() {
    return <Suspense><CookiesBoundary><Sub/></CookiesBoundary></Suspense>
}
