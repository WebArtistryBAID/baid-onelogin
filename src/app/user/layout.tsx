import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode, faHome, faPeopleGroup, faTicket } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from '@/app/i18n'
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
                    <FontAwesomeIcon icon={faHome}/>
                </div>
                <p className="nav-content">{t('nav.home')}</p>
            </Link>
            <Link href="/user/authorizations" className="nav-item">
                <div className="nav-image">
                    <FontAwesomeIcon icon={faTicket}/>
                </div>
                <p className="nav-content">{t('nav.authorizations')}</p>
            </Link>
            <p className="text-xs text-center mt-5 mb-2 text-gray-600 dark:text-gray-400">{t('nav.developers')}</p>
            <Link href="/user/organizations" className="nav-item">
                <div className="nav-image">
                    <FontAwesomeIcon icon={faPeopleGroup}/>
                </div>
                <p className="nav-content">{t('nav.organizations')}</p>
            </Link>
            <Link href="/user/applications" className="nav-item">
                <div className="nav-image">
                    <FontAwesomeIcon icon={faCode}/>
                </div>
                <p className="nav-content">{t('nav.applications')}</p>
            </Link>
        </div>
        <div className="base-content">
            {children}
        </div>
    </div>
}