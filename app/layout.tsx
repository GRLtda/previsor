import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });



export const metadata: Metadata = {
  title: {
    default: 'Previzor - Mercado de Previsões',
    template: '%s | Previzor',
  },
  description: 'A plataforma líder em mercados de previsão no Brasil. Transforme seu conhecimento em lucro prevendo resultados de eventos reais.',
  keywords: ['previsões', 'mercado', 'política', 'economia', 'esportes', 'crypto', 'eleições', 'betting'],
  authors: [{ name: 'Previzor Team' }],
  creator: 'Previzor',
  metadataBase: new URL('https://previzor.com'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://previzor.com',
    title: 'Previzor - Mercado de Previsões',
    description: 'A plataforma líder em mercados de previsão no Brasil. Transforme seu conhecimento em lucro.',
    siteName: 'Previzor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Previzor Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Previzor',
    description: 'Transforme seu conhecimento em lucro no maior mercado de previsões do Brasil.',
    creator: '@previzor',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased ${_geist.variable} ${_geistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
