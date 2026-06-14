import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AppAuthGuard from '@/components/layout/AppAuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContentAI — Central de Conteúdo',
  description: 'Plataforma inteligente de gestão de conteúdo para redes sociais',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <AppAuthGuard>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
              </div>
            </div>
          </AppAuthGuard>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: '13px', borderRadius: '10px' },
            success: { iconTheme: { primary: '#534AB7', secondary: '#EEEDFE' } },
          }}
        />
      </body>
    </html>
  );
}
