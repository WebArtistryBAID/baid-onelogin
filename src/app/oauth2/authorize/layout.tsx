export default async function AuthorizeLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return <main>
        <div className="simple-container">
            {children}
        </div>
    </main>
}
