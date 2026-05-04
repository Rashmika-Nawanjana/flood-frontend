'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0b1326',
        color: '#fff',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#EF4444' }}>
        Something went wrong
      </h2>
      <p style={{ marginBottom: '24px', color: '#9CA3AF', fontSize: '14px' }}>
        We encountered an unexpected error. Please try again or contact support.
      </p>
      {process.env.NODE_ENV === 'development' && error.message && (
        <details
          style={{
            marginBottom: '24px',
            padding: '12px',
            background: '#1F2937',
            borderRadius: '8px',
            textAlign: 'left',
            maxWidth: '500px',
            overflow: 'auto',
          }}
        >
          <summary style={{ cursor: 'pointer', color: '#3B82F6' }}>
            Error Details (Dev Only)
          </summary>
          <pre
            style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#F3F4F6',
              overflow: 'auto',
            }}
          >
            {error.message}
          </pre>
        </details>
      )}
      <button
        onClick={reset}
        style={{
          padding: '10px 24px',
          background: '#3B82F6',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        Try again
      </button>
    </div>
  );
}
