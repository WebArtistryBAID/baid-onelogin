import {useTranslation} from '@/app/i18n'

export default async function AuthPage({searchParams}: { searchParams: never }) {
    const {t} = await useTranslation('auth')
    const back = searchParams['redirect'] || '/'
    const redirect = `https://passport.seiue.com/authorize?response_type=token&client_id=${process.env.SEIUE_CLIENT_ID}&school_id=452&scope=reflection.read_basic&redirect_uri=${encodeURIComponent(`${process.env.HOSTED}/auth/callback?redirect=${encodeURIComponent(back)}`)}`

    return <div className="simple-container flex flex-col justify-center items-center">
        <h1 className="mb-1 text-center">{t('onelogin')}</h1>
        <p className="text-center text-sm mb-5">{t('description')}</p>
        <a href={redirect} className="mb-3 w-full btn block text-center">{t('loginSeiue')}</a>
        <button className="mb-3 w-full btn-secondary">{t('loginAccessCode')}</button>
    </div>
}
