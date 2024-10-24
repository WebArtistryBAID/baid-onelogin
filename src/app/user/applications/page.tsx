import { useTranslation } from '@/app/i18n'

export default async function Applications() {
    const { t } = await useTranslation('applications')
    return <div>
        <h1>{t('title')}</h1>
    </div>
}
