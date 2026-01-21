import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
