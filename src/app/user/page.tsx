import {useTranslation} from '@/app/i18n'
import {getMe} from '@/app/lib/userActions'

export default async function Home() {
    const {t} = await useTranslation('home')
    const user = await getMe()

    return <div>
        <h1 className="mb-3">{t('welcome')}</h1>
        <p className="mb-5">{t('intro')}</p>

        <div
            className="flex flex-col lg:flex-row w-full lg:justify-start lg:text-left text-center justify-center items-center mb-3">
            <div
                className="bg-blue-500 text-white rounded-full w-16 h-16 flex justify-center items-center mb-3 lg:mb-0 lg:mr-3 p-5">
                <p className="text-xl font-bold font-display">{user.name[0]}</p>
            </div>
            <div>
                <p className="text-xl font-bold font-display">{user.name}</p>
                <p className="text-sm">{user.pinyin}</p>
            </div>
        </div>

        <p className="text-sm secondary">{t('userInfo')}</p>
        <table className="w-full">
            <tbody>
            <tr className="w-full">
                <th className="w-1/3 text-left">{t('seiueId')}</th>
                <td className="w-2/3">{user.seiueId}</td>
            </tr>
            <tr className="w-full">
                <th className="w-1/3 text-left">{t('schoolId')}</th>
                <td className="w-2/3">{user.schoolId}</td>
            </tr>
            <tr className="w-full">
                <th className="w-1/3 text-left">{t('phone')}</th>
                <td className="w-2/3">{user.phone ?? t('none')}</td>
            </tr>
            <tr className="w-full">
                <th className="w-1/3 text-left">{t('adminClass0')}</th>
                <td className="w-2/3">{user.adminClass0 ?? t('notApplicable')}</td>
            </tr>
            <tr className="w-full">
                <th className="w-1/3 text-left">{t('classTeacher0')}</th>
                <td className="w-2/3">{user.classTeacher0 ?? t('notApplicable')}</td>
            </tr>
            <tr className="w-full">
                <th className="w-1/3 text-left">{t('gender')}</th>
                <td className="w-2/3">{{
                    'male': t('male'),
                    'female': t('female'),
                    'others': t('others')
                }[user.gender]}</td>
            </tr>
            <tr className="w-full">
                <th className="w-1/3 text-left">{t('type')}</th>
                <td className="w-2/3">{{
                    'student': t('student'),
                    'teacher': t('teacher')
                }[user.type]}</td>
            </tr>
            </tbody>
        </table>
    </div>
}