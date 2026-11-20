import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/GoogleAuthProvider';
import { AuthGuard } from '@/components/AuthGuard';
import { TopBar } from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'Integra Rizzi - Agenda de Recursos | CE Pedro Rizzi',
  description: 'Visualize e gerencie as reservas de recursos do Centro Educacional Pedro Rizzi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#f4f6fa] text-slate-900 min-h-screen flex flex-col">
        <AuthProvider>
          <AuthGuard>
            <TopBar />
            <div className="flex-1 flex flex-col min-w-0 w-full">
              <main className="p-2 sm:p-4 md:p-5 w-full">
                {children}
              </main>
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
