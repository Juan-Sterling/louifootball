import './globals.css';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'LOUIFOOTBALL | Official Catalog',
  description: 'Merchandise resmi sepak bola karya suporter untuk pecinta bola di seluruh Indonesia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={outfit.variable}>
      <body className="loui-pitch-bg min-h-screen text-gray-900 font-sans antialiased selection:bg-lime-400 selection:text-black flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
