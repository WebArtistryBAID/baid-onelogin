import { useTranslation } from '@/app/i18n'
import Link from 'next/link'
import Branding from '@/app/lib/Branding'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobeAsia } from '@fortawesome/free-solid-svg-icons'

export default async function AuthPage({ searchParams }: { searchParams: never }) {
    const { t } = await useTranslation('auth')
    const back = (await searchParams)['redirect'] || '/'
    const redirect = `https://passport.seiue.com/authorize?response_type=token&client_id=${process.env.SEIUE_CLIENT_ID}&school_id=452&scope=reflection.read_basic&redirect_uri=${encodeURIComponent(`${process.env.HOSTED}/auth/callback?redirect=${encodeURIComponent(back)}`)}`

    return <div className="simple-container">
        <Branding/>
        <div className="p-5 w-full h-full flex flex-col justify-center items-center">
            <h1 className="mb-1">{t('title')}</h1>
            <p className="mb-5 text-sm">{t('description')}</p>
            <div className="flex flex-col gap-3 w-full mb-5">
                <a href={redirect}
                   className="flex items-center gap-3 bg-gray-50 rounded  dark:bg-gray-800 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                    <div className="bg-white rounded-full flex items-center justify-center w-8 h-8">
                        <img alt="" src="/images/seiue.webp" className="w-6 h-6 rounded-full"/>
                    </div>
                    <p>{t('loginSeiue')}</p>
                </a>
                <Link href={`/auth/code?redirect=${encodeURIComponent(back)}`}
                      className="flex items-center gap-3 bg-gray-50 rounded  dark:bg-gray-800 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                    <div className="text-white bg-blue-500 rounded-full flex items-center justify-center w-8 h-8">
                        <FontAwesomeIcon icon={faGlobeAsia}/>
                    </div>
                    <p>{t('loginAccessCode')}</p>
                </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('message')}</p>
        </div>
    </div>
}
