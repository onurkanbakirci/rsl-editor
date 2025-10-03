"use client"

import { Analytics as VercelAnalytics } from "@vercel/analytics/react"
import Script from "next/script"

export function Analytics() {
  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-EL3BT0LNBV"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-EL3BT0LNBV');
        `}
      </Script>
      
      {/* Vercel Analytics */}
      <VercelAnalytics />
    </>
  )
}
