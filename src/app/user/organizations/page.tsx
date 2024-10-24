import { useTranslation } from '@/app/i18n'

export default async function Organizations() {
    const { t } = await useTranslation('organizations')
    return <div>
        <h1>{t('title')}</h1>
    </div>
}
