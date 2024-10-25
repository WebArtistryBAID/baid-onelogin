import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCode, faHome, faTicket} from '@fortawesome/free-solid-svg-icons'
import {useTranslation} from '@/app/i18n'
import Link from 'next/link'

export default async function UserLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { t } = await useTranslation('home')

    return <div className="base-container">
        <div className="base-nav">
            <Link href="/user" className="nav-item">
                <div className="nav-image">
                    <FontAwesomeIcon icon={faHome} aria-label={t('nav.home')}/>
                </div>
                <p className="nav-content">{t('nav.home')}</p>
            </Link>
            <Link href="/user/authorizations" className="nav-item">
                <div className="nav-image">
                    <FontAwesomeIcon icon={faTicket} aria-label={t('nav.authorizations')}/>
                </div>
                <p className="nav-content">{t('nav.authorizations')}</p>
            </Link>
            <p className="text-xs text-center mt-5 mb-2 secondary lg:block hidden">{t('nav.developers')}</p>
            <Link href="/user/applications" className="nav-item">
                <div className="nav-image">
                    <FontAwesomeIcon icon={faCode} aria-label={t('nav.applications')}/>
                </div>
                <p className="nav-content">{t('nav.applications')}</p>
            </Link>
        </div>
        <div className="base-content">
            {children}
        </div>
    </div>
}