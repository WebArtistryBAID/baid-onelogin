import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    // Stop other sites from framing the consent page (clickjacking)
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Content-Security-Policy', value: 'frame-ancestors \'none\'' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
                ]
            }
        ]
    }
}

export default nextConfig
