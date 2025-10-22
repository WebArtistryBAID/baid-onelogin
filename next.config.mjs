/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n: {
        locales: ['en', 'zh-CN'],
        defaultLocale: 'en',
        localeDetection: false
    },
  eslint: {
    ignoreDuringBuilds: true
  }
}

export default nextConfig
