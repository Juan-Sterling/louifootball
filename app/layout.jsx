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
  icons: {
    icon: 'https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg',
    apple: 'https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={outfit.variable}>
      <head>
        <link
          rel="icon"
          href="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
        />
        <link
          rel="apple-touch-icon"
          href="https://res.cloudinary.com/og1jrvy3/image/upload/f_auto,q_auto,w_100/v1789010759/756654575_17897804865557650_2370756875670529296_n.jpg"
        />
      </head>
      <body className="loui-pitch-bg min-h-screen text-gray-900 font-sans antialiased selection:bg-lime-400 selection:text-black flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
