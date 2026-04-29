export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0b1326',
      color: '#dbe2fd',
      fontFamily: 'Inter, sans-serif',
      gap: '16px',
    }}>
      <h1 style={{ fontSize: '72px', fontWeight: 700, color: '#3B82F6', fontFamily: 'JetBrains Mono, monospace' }}>
        404
      </h1>
      <p style={{ fontSize: '18px', color: '#8c909f' }}>
        Page not found — return to the{' '}
        <a href="/" style={{ color: '#3B82F6', textDecoration: 'underline' }}>
          Dashboard
        </a>
      </p>
    </div>
  );
}
