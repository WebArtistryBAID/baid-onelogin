import { useTranslation } from '@/app/i18n'
import { getMe } from '@/app/lib/userActions'

export default async function Home() {
    const { t } = await useTranslation('home')
    const user = await getMe()

    return <div>
        <h1>{t('welcome')}</h1>
    </div>
}