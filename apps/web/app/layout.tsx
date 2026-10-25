import './globals.css';

export const metadata = {
  title: 'PayMesh',
  description: 'Payment authorization for AI agents',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
