
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RegenKernel | Offline-First Impact Capture',
  description: 'RegenKernel is a sovereign, offline-first tool for capturing and verifying regenerative actions directly from the field.',
};

export default function KernelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <head>
        <link rel="manifest" href="/kernel/manifest.json" />
        <meta name="theme-color" content="#1A4222" />
      </head>
      {children}
    </>
  );
}
