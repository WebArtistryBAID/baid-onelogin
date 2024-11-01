export default async function AuthorizeLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return <main className="lg:bg-[url(/images/bg-ad.jpg)]">
        <div className="simple-container">
            {children}
        </div>
    </main>
}
