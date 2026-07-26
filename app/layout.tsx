import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
