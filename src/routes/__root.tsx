import { HeadContent, Scripts, createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { AuthProvider } from '../components/AuthProvider'
import { ToastProvider } from '../components/ToastProvider'
import { ClerkProvider } from '@clerk/react'

import appCss from '../styles.css?url'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '2U — Letters to Your Future Self' },
      { name: 'description', content: 'Write letters to your future self and receive them on the date you choose.' },
    ],
    links: [
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/favicon.png' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Dancing+Script:wght@500;700&family=Alex+Brush&display=swap',
      },
    ],
  }),
  notFoundComponent: () => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📮</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ color: 'var(--ink-light)', marginBottom: 24 }}>The letter or page you're looking for lost its way in transit.</p>
      <Link to="/app" className="btn btn-primary">Return to Mailbox →</Link>
    </div>
  ),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          signInUrl="/login"
          signUpUrl="/register"
          signInFallbackRedirectUrl="/app"
          signUpFallbackRedirectUrl="/app"
          appearance={{
            variables: {
              colorPrimary: '#8B1A1A',
              colorForeground: '#2C1810',
              colorMutedForeground: '#5C3A28',
              colorBackground: '#FEF9EE',
              borderRadius: '8px',
              fontFamily: "'Lato', sans-serif",
            },
            elements: {
              card: {
                backgroundColor: '#FEF9EE',
                boxShadow: 'none',
              },
            },
          }}
        >
          <AuthProvider>
            <ToastProvider>
              <Outlet />
            </ToastProvider>
          </AuthProvider>
          <Scripts />
        </ClerkProvider>
      </body>
    </html>
  )
}
