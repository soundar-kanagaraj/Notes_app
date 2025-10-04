import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/redux/Providers'

export const metadata: Metadata = {
    title: 'NotesApp - Your Personal Note Taking Solution',
    description: 'A modern, secure note-taking application built with Next.js and Flask',
    keywords: 'notes, note-taking, productivity, organization'
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}