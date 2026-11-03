import './globals.css';
import { DM_Sans, Kanit } from 'next/font/google';
import localFont from 'next/font/local';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const kanit = Kanit({
  subsets: ['latin'],
  weight: ['800'],
  style: ['italic'],
  display: 'swap',
  variable: '--font-kanit-italic',
});

const louiFootball = localFont({
  src: './LOUI_FOOTBALL.otf',
  variable: '--font-loui-football',
  display: 'swap',
  declarations: [
    { prop: 'unicode-range', value: 'U+0000-0027, U+002A-005A, U+005E-007A, U+007E-FFFF' },
  ],
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
    <html lang="id" className={`${dmSans.variable} ${kanit.variable} ${louiFootball.variable}`}>
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
