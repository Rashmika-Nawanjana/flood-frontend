import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FloodSense LK — Intelligence Portal',
  description:
    'Real-time flood monitoring, AI-powered predictions, and emergency response management for Sri Lanka.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'var(--font-ui)' }}>
        {children}
      </body>
    </html>
  );
}
