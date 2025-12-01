import './globals.css';
import type { Metadata } from 'next';
import { Merriweather } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { NextAuthProvider } from '@/components/session-provider';

const merriweather = Merriweather({ 
  subsets: ['latin'],
  weight: ['300', '400', '700', '900']
});

export const metadata: Metadata = {
  title: 'AOK Perpetual Group - Financial Planning & Retirement Solutions',
  description: 'Professional financial planning services to improve your financial position and secure your retirement future.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={merriweather.className}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={true}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
