// app/layout.tsx
import './globals.css';
import { Inter, Orbitron } from 'next/font/google';
import LeftSidebar from '../components/navigation/LeftSidebar';
import TopRibbon from '../components/navigation/TopRibbon';

const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });
const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700'] });

export const metadata = {
  title: 'Gangsta AI',
  description: 'Truth Infrastructure',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} ${orbitron.className}`}>
      <body className="bg-tron-dark text-tron-cyan flex">

        {/* --- Fixed Left Sidebar (never moves) --- */}
        <div className="fixed left-0 top-0 h-full w-20 z-50">
          <LeftSidebar />
        </div>

        {/* --- Main Content area pushed to the right --- */}
        <div className="flex-1 ml-50 flex flex-col min-h-screen">

          {/* --- Top Intelligence Ribbon --- */}
          <div className="sticky top-0 z-40 bg-tron-dark/80 backdrop-blur-xl border-b  border-b-cyan-500">
            <div className="pl-6">
              <TopRibbon />
            </div>
          </div>


          {/* --- Main page content --- */}
          <main className="flex-1 p-6 md:p-10 lg:p-12">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}
