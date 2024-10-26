'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Error({ message }: { message: string }) {
    const { t } = useTranslationClient('authorize')
    return <div className="flex justify-center items-center flex-col p-8">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-12 mb-3 text-red-500"/>
        <h1 className="mb-5">{t('error')}</h1>
        <p className="text-center mb-3">{t(message)}</p>
        <button className="btn" onClick={() => history.back()}>{t('back')}</button>
    </div>
}
