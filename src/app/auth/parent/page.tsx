'use client'

import { useTranslationClient } from '@/app/i18n/client'

export default function ParentError() {
    const { t } = useTranslationClient('auth')
    return <div className="flex justify-center items-center h-screen">
        <p>{t('parent')}</p>
    </div>
}
