import Script from "next/script"

/**
 * gtag.js — solo en producción Y con NEXT_PUBLIC_GA_MEASUREMENT_ID.
 * En local (`next dev`) nunca carga, aunque la variable esté en .env.local.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  if (process.env.NODE_ENV !== "production" || !id) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  )
}
