import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/GoogleAuthProvider';
import { AuthGuard } from '@/components/AuthGuard';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Agenda de Recursos - CE Pedro Rizzi',
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
      <body className="antialiased bg-[#f4f6fa] text-slate-900 min-h-screen flex flex-col md:flex-row">
        <AuthProvider>
          <AuthGuard>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              <main className="p-3 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
