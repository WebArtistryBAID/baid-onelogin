import { useTranslation } from '@/app/i18n'

export default async function Authorizations() {
    const { t } = await useTranslation('authorizations')
    return <div>
        <h1>{t('title')}</h1>
    </div>
}
