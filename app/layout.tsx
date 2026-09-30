import "./globals.css";

export const metadata = {
  title: "hannah gao ✶",
  description: "Paintings and works by Hannah Gao.",
  metadataBase: new URL("https://hannahgao.studio"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "hannah gao ✶",
    description: "Paintings and works by Hannah Gao.",
    type: "website",
    url: "https://hannahgao.studio",
    images: [
      {
        url: "/artwork/studio-pic.jpg",
        width: 2000,
        height: 1500,
        alt: "Hannah Gao painting in her home studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "hannah gao ✶",
    description: "Paintings and works by Hannah Gao.",
    images: ["/artwork/studio-pic.jpg"],
  },
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
