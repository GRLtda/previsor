import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })


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
    icon: '/favicon.svg',
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
      <body className={`font-sans antialiased ${inter.variable}`}>
        {children}
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__lc = window.__lc || {};
              window.__lc.license = 19518669;
              window.__lc.integration_name = "manual_channels";
              window.__lc.product_name = "livechat";
              ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};!n.__lc.asyncInit&&e.init(),n.LiveChatWidget=n.LiveChatWidget||e}(window,document,[].slice))
            `,
          }}
        />
        <noscript>
          <a href="https://www.livechat.com/chat-with/19518669/" rel="nofollow">Chat with us</a>,
          powered by <a href="https://www.livechat.com/?welcome" rel="noopener nofollow" target="_blank">LiveChat</a>
        </noscript>
      </body>
    </html>
  )
}
