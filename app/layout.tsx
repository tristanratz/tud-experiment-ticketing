import type { Metadata } from 'next';
import './globals.css';
import TrackingInitializer from '@/components/TrackingInitializer';

export const metadata: Metadata = {
  title: 'Customer Support Ticket System - Research Study',
  description: 'Experimental platform for research study on ticket system interfaces',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TrackingInitializer />
        {children}
      </body>
    </html>
  );
}
