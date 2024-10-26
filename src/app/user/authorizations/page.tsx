import { useTranslation } from '@/app/i18n'
import { getMyAuths } from '@/app/lib/user-actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHourglassEmpty } from '@fortawesome/free-solid-svg-icons'

export default async function Authorizations() {
    const { t } = await useTranslation('authorizations')
    const auths = await getMyAuths()

    if (auths.length < 1) {
        return <div className="w-full h-full flex-col flex">
            <h1 className="flex-shrink">{t('title')}</h1>
            <div className="flex-grow flex flex-col justify-center items-center">
                <FontAwesomeIcon icon={faHourglassEmpty} className="h-16 text-gray-400 dark:text-gray-600 mb-3"/>
                <p className="text-sm">{t('noApps')}</p>
            </div>
        </div>
    }

    return <div>
        <h1>{t('title')}</h1>
    </div>
}
