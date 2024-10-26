export default async function AuthorizeLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return <div className="simple-container">
        {children}
    </div>
}
