import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode, faHome, faStamp, faTicket } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from '@/app/i18n'
import Link from 'next/link'
import { getMe } from '@/app/lib/user-actions'
import If from '@/app/lib/If'

export default async function UserLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { t } = await useTranslation('home')
    const me = await getMe()

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
            <If condition={me.admin}>
                <Link href="/user/approvals" className="nav-item">
                    <div className="nav-image">
                        <FontAwesomeIcon icon={faStamp} aria-label={t('nav.approval')}/>
                    </div>
                    <p className="nav-content">{t('nav.approval')}</p>
                </Link>
            </If>
        </div>
        <div className="base-content">
            {children}
        </div>
    </div>
}