'use client'

import { useRouter } from 'next/navigation'
import { logOut } from '@/app/lib/user-actions'
import { useEffect } from 'react'
import { useTranslationClient } from '@/app/i18n/client'

export default function LogoutPage() {
    const { t } = useTranslationClient('home')
    const router = useRouter()

    useEffect(() => {
        (async () => {
            await logOut()
            router.push('/')
        })()
    }, [ router ])

    return <>{t('wait')}</>
}
