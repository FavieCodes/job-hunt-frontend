import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import GoogleProvider from '@/components/auth/GoogleProvider';
import StyledJsxRegistry from './registry';

// ─── Site-wide constants ──────────────────────────────────────────────────────
const SITE_NAME    = 'ZenJobHunt';
const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-job-hunt.vercel.app';
const SITE_TITLE   = 'ZenJobHunt — Find Remote Jobs & Scholarships in Nigeria & Worldwide';
const SITE_DESC    =
  'Search 2,000+ remote jobs and scholarships from Nigeria, Africa, and worldwide. ' +
  'Apply to tech, design, marketing, and more — updated daily with verified listings.';
const OG_IMAGE     = `${SITE_URL}/og-image.png`;

// ─── Root metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    'jobs in Nigeria', 'remote jobs Nigeria', 'Nigerian jobs', 'Africa jobs',
    'scholarships Nigeria', 'scholarships for Nigerians', 'African scholarships',
    'remote work Africa', 'tech jobs Nigeria', 'software developer jobs Nigeria',
    'job board Nigeria', 'online jobs Nigeria', 'work from home Nigeria',
    'scholarships 2025', 'scholarships 2026', 'fully funded scholarships',
    'international scholarships Africa', 'job hunt', 'career opportunities Africa',
  ],

  authors: [{ name: 'ZenJobHunt', url: SITE_URL }],
  creator:  'ZenJobHunt',
  publisher: 'ZenJobHunt',

  robots: {
    index:          true,
    follow:         true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  // Open Graph
  openGraph: {
    type:        'website',
    locale:      'en_NG',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       SITE_TITLE,
    description: SITE_DESC,
    images: [
      {
        url:    OG_IMAGE,
        width:  1200,
        height: 630,
        alt:    `${SITE_NAME} — Jobs & Scholarships`,
      },
    ],
  },

  // Twitter / X
  twitter: {
    card:        'summary_large_image',
    title:       SITE_TITLE,
    description: SITE_DESC,
    images:      [OG_IMAGE],
    creator:     '@zenjobhunt',
    site:        '@zenjobhunt',
  },

  // Canonical + alternates
  alternates: {
    canonical: SITE_URL,
  },

  // PWA / favicon
  icons: {
    icon:       '/favicon.ico',
    shortcut:   '/favicon-16x16.png',
    apple:      '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',

  // Verification (add your IDs when you have them)
  // verification: {
  //   google: 'YOUR_GOOGLE_SEARCH_CONSOLE_ID',
  //   yandex: 'YOUR_YANDEX_VERIFICATION',
  // },
};

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#06b6d4',
};

// ─── JSON-LD structured data ──────────────────────────────────────────────────
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       SITE_NAME,
  url:        SITE_URL,
  description: SITE_DESC,
  potentialAction: {
    '@type':       'SearchAction',
    target:        `${SITE_URL}/jobs?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type':    'Organization',
  name:       SITE_NAME,
  url:        SITE_URL,
  logo:       `${SITE_URL}/logo.png`,
  sameAs:     [],
};

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* Preconnect to external origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <StyledJsxRegistry>
          <GoogleProvider>
            {children}
          </GoogleProvider>
        </StyledJsxRegistry>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'var(--font-body)', fontSize: '0.9rem' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}