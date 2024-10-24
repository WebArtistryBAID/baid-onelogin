import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            fontFamily: {
                display: [ 'var(--font-inter)', 'var(--font-noto-sans-sc)', 'BlinkMacSystemFont', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'sans-serif' ],
                body: [ 'var(--font-inter)', 'var(--font-noto-sans-sc)', 'BlinkMacSystemFont', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'sans-serif' ]
            }
        }
    },
    plugins: []
};
export default config;
