import "./globals.css";

export const metadata = {
  title: "hannah gao ✶",
  description: "hannah gao",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
