import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import GoogleProvider from '@/components/auth/GoogleProvider';

export const metadata: Metadata = {
  title: 'JobHunt — Find Your Next Role',
  description: 'Search thousands of jobs and scholarships.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>
        <GoogleProvider>
          {children}
        </GoogleProvider>
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