'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
            background: '#ffffff',
            color: '#111827',
          }}
        >
          <div style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Something went wrong</h1>
            <p style={{ marginTop: '12px', color: '#4b5563' }}>
              The application hit an unexpected error. Reload the page to try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: '20px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #111827',
                background: '#111827',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
