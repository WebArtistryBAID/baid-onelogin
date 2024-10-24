import {createInstance} from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import {initReactI18next} from 'react-i18next/initReactI18next'
import {cookieName, getOptions} from './settings'
import acceptLanguage from 'accept-language'
import {cookies, headers} from 'next/headers'

acceptLanguage.languages(getOptions().supportedLngs)

const initI18next = async (lng: string, ns: string) => {
    const i18nInstance = createInstance()
    await i18nInstance
        .use(initReactI18next)
        .use(resourcesToBackend((language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)))
        .init(getOptions(lng, ns))
    return i18nInstance
}

export async function useTranslation(ns: string) {
    let lng
    if (cookies().has(cookieName)) lng = acceptLanguage.get(cookies().get(cookieName)!.value)
    if (!lng) lng = acceptLanguage.get(headers().get('Accept-Language'))
    if (!lng) lng = getOptions().fallbackLng

    const i18nextInstance = await initI18next(lng, ns)
    return {
        t: i18nextInstance.getFixedT(lng, Array.isArray(ns) ? ns[0] : ns),
        i18n: i18nextInstance
    }
}
