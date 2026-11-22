import './globals.css';

export const metadata = {
  title: 'Petal — Express Checkout',
  description: 'Fast, elegant, and reliable online checkout built with Next.js 16 and React 19',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
