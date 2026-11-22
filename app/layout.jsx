import './globals.css';

export const metadata = {
  title: 'QuickShop — Express Checkout',
  description: 'Fast, simple, and reliable online checkout built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
