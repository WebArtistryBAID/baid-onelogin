import Branding from '@/app/lib/Branding'

export default async function AuthorizeLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return <main>
        <div className="simple-container">
            <Branding/>
            {children}
        </div>
    </main>
}
