'use client';

import Script from 'next/script';

/**
 * Validates if a GTM container ID has the correct format
 * Format: GTM-XXXXXXX (letters and numbers after GTM-)
 */
function isValidGTMContainerId(containerId: string | undefined): boolean {
  if (!containerId) {
    return false;
  }
  const gtmContainerIdPattern = /^GTM-[A-Z0-9]+$/i;
  return gtmContainerIdPattern.test(containerId);
}

interface GoogleTagManagerProps {
  containerId?: string;
}

/**
 * Google Tag Manager component
 * Adds GTM script to the page when a valid container ID is provided
 */
export function GoogleTagManager({ containerId }: GoogleTagManagerProps) {
  const gtmId = containerId || process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
  const shouldLoadGTM = isValidGTMContainerId(gtmId);

  if (!shouldLoadGTM || !gtmId) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

